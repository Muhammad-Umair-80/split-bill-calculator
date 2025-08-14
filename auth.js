/**
 * Authentication System for Split Bill Calculator
 * Handles user registration, login, and data persistence using JSON files
 */

// Global variables
let currentForm = 'signin';
let users = [];
let currentUser = null;

// DOM elements
const authContainer = document.getElementById('authContainer');
const loading = document.getElementById('loading');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const signInToggle = document.getElementById('signInToggle');
const signUpToggle = document.getElementById('signUpToggle');
const successModal = document.getElementById('successModal');

/**
 * Initialize the authentication system
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing authentication system...');
    
    // Load existing users from JSON file
    loadUsers();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkExistingSession();
    
    // Hide loading screen and show auth container
    setTimeout(() => {
        loading.style.display = 'none';
        authContainer.style.display = 'flex';
    }, 1500);
});

/**
 * Set up all event listeners for forms and buttons
 */
function setupEventListeners() {
    // Form submissions
    signInForm.addEventListener('submit', handleSignIn);
    signUpForm.addEventListener('submit', handleSignUp);
    
    // Input validation on blur
    document.getElementById('signUpUsername').addEventListener('blur', validateUsername);
    document.getElementById('signUpEmail').addEventListener('blur', validateEmail);
    document.getElementById('signUpPassword').addEventListener('input', validatePassword);
    document.getElementById('signUpConfirmPassword').addEventListener('input', validateConfirmPassword);
    
    // Real-time password confirmation validation
    document.getElementById('signUpPassword').addEventListener('input', () => {
        validateConfirmPassword();
    });
    
    // Close modal when clicking outside
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSuccessModal();
        }
    });
}

/**
 * Switch between Sign In and Sign Up forms
 * @param {string} formType - 'signin' or 'signup'
 */
function switchForm(formType) {
    console.log(`Switching to ${formType} form`);
    
    // Update toggle buttons
    if (formType === 'signin') {
        signInToggle.classList.add('active');
        signUpToggle.classList.remove('active');
        signInForm.classList.add('active');
        signUpForm.classList.remove('active');
        currentForm = 'signin';
    } else {
        signUpToggle.classList.add('active');
        signInToggle.classList.remove('active');
        signUpForm.classList.add('active');
        signInForm.classList.remove('active');
        currentForm = 'signup';
    }
    
    // Clear any existing alerts
    clearAlerts();
    
    // Reset form validation states
    resetFormValidation();
}

/**
 * Handle Sign In form submission
 * @param {Event} e - Form submission event
 */
async function handleSignIn(e) {
    e.preventDefault();
    console.log('Processing sign in...');
    
    // Get form data
    const username = document.getElementById('signInUsername').value.trim();
    const password = document.getElementById('signInPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate inputs
    if (!username || !password) {
        showAlert('signInAlert', 'Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading('signInBtn', true);
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find user in the loaded users array
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );
        
        if (user) {
            // Successful login
            currentUser = user;
            
            // Save session if remember me is checked
            if (rememberMe) {
                localStorage.setItem('splitBillUser', JSON.stringify(user));
            } else {
                sessionStorage.setItem('splitBillUser', JSON.stringify(user));
            }
            
            // Show success message
            showAlert('signInAlert', `Welcome back, ${user.username}!`, 'success');
            
            // Redirect to main application after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            // Invalid credentials
            showAlert('signInAlert', 'Invalid username or password', 'error');
            document.getElementById('signInPassword').value = '';
            document.getElementById('signInPassword').focus();
        }
        
    } catch (error) {
        console.error('Sign in error:', error);
        showAlert('signInAlert', 'An error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading('signInBtn', false);
    }
}

/**
 * Handle Sign Up form submission
 * @param {Event} e - Form submission event
 */
async function handleSignUp(e) {
    e.preventDefault();
    console.log('Processing sign up...');
    
    // Get form data
    const username = document.getElementById('signUpUsername').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validate all inputs
    if (!validateAllSignUpFields(username, email, password, confirmPassword, agreeTerms)) {
        return;
    }
    
    // Show loading state
    setButtonLoading('signUpBtn', true);
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if username already exists
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            showAlert('signUpAlert', 'Username already exists. Please choose another one.', 'error');
            document.getElementById('signUpUsername').focus();
            return;
        }
        
        // Check if email already exists
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showAlert('signUpAlert', 'Email already registered. Please use a different email.', 'error');
            document.getElementById('signUpEmail').focus();
            return;
        }
        
        // Create new user object
        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: password, // In a real app, this should be hashed
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        // Add user to users array
        users.push(newUser);
        
        // Save updated users to JSON file
        await saveUsers();
        
        // Show success modal
        showSuccessModal('Account Created!', `Welcome to Split Bill Calculator, ${username}! Your account has been created successfully.`);
        
        // Clear form
        signUpForm.reset();
        
        // Switch to sign in form after modal is closed
        setTimeout(() => {
            switchForm('signin');
        }, 2000);
        
    } catch (error) {
        console.error('Sign up error:', error);
        showAlert('signUpAlert', 'An error occurred while creating your account. Please try again.', 'error');
    } finally {
        setButtonLoading('signUpBtn', false);
    }
}

/**
 * Validate all Sign Up form fields
 * @param {string} username - Username input
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @param {string} confirmPassword - Confirm password input
 * @param {boolean} agreeTerms - Terms agreement checkbox
 * @returns {boolean} - True if all validations pass
 */
function validateAllSignUpFields(username, email, password, confirmPassword, agreeTerms) {
    let isValid = true;
    
    // Username validation
    if (!username) {
        showAlert('signUpAlert', 'Username is required', 'error');
        document.getElementById('signUpUsername').focus();
        isValid = false;
    } else if (username.length < 3 || username.length > 30) {
        showAlert('signUpAlert', 'Username must be between 3 and 30 characters', 'error');
        document.getElementById('signUpUsername').focus();
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showAlert('signUpAlert', 'Username can only contain letters, numbers, and underscores', 'error');
        document.getElementById('signUpUsername').focus();
        isValid = false;
    }
    
    // Email validation
    if (!email) {
        showAlert('signUpAlert', 'Email is required', 'error');
        if (isValid) document.getElementById('signUpEmail').focus();
        isValid = false;
    } else if (!isValidEmail(email)) {
        showAlert('signUpAlert', 'Please enter a valid email address', 'error');
        if (isValid) document.getElementById('signUpEmail').focus();
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showAlert('signUpAlert', 'Password is required', 'error');
        if (isValid) document.getElementById('signUpPassword').focus();
        isValid = false;
    } else if (password.length < 8) {
        showAlert('signUpAlert', 'Password must be at least 8 characters long', 'error');
        if (isValid) document.getElementById('signUpPassword').focus();
        isValid = false;
    }
    
    // Confirm password validation
    if (!confirmPassword) {
        showAlert('signUpAlert', 'Please confirm your password', 'error');
        if (isValid) document.getElementById('signUpConfirmPassword').focus();
        isValid = false;
    } else if (password !== confirmPassword) {
        showAlert('signUpAlert', 'Passwords do not match', 'error');
        if (isValid) document.getElementById('signUpConfirmPassword').focus();
        isValid = false;
    }
    
    // Terms agreement validation
    if (!agreeTerms) {
        showAlert('signUpAlert', 'You must agree to the Terms of Service and Privacy Policy', 'error');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate username input
 */
function validateUsername() {
    const username = document.getElementById('signUpUsername').value.trim();
    const usernameInput = document.getElementById('signUpUsername');
    
    if (!username) {
        setInputError(usernameInput, 'Username is required');
        return false;
    }
    
    if (username.length < 3 || username.length > 30) {
        setInputError(usernameInput, 'Username must be between 3 and 30 characters');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setInputError(usernameInput, 'Username can only contain letters, numbers, and underscores');
        return false;
    }
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setInputError(usernameInput, 'Username already exists');
        return false;
    }
    
    setInputSuccess(usernameInput);
    return true;
}

/**
 * Validate email input
 */
function validateEmail() {
    const email = document.getElementById('signUpEmail').value.trim();
    const emailInput = document.getElementById('signUpEmail');
    
    if (!email) {
        setInputError(emailInput, 'Email is required');
        return false;
    }
    
    if (!isValidEmail(email)) {
        setInputError(emailInput, 'Please enter a valid email address');
        return false;
    }
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setInputError(emailInput, 'Email already registered');
        return false;
    }
    
    setInputSuccess(emailInput);
    return true;
}

/**
 * Validate password input
 */
function validatePassword() {
    const password = document.getElementById('signUpPassword').value;
    const passwordInput = document.getElementById('signUpPassword');
    
    if (!password) {
        setInputError(passwordInput, 'Password is required');
        return false;
    }
    
    if (password.length < 8) {
        setInputError(passwordInput, 'Password must be at least 8 characters long');
        return false;
    }
    
    setInputSuccess(passwordInput);
    return true;
}

/**
 * Validate confirm password input
 */
function validateConfirmPassword() {
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;
    const confirmPasswordInput = document.getElementById('signUpConfirmPassword');
    
    if (!confirmPassword) {
        setInputError(confirmPasswordInput, 'Please confirm your password');
        return false;
    }
    
    if (password !== confirmPassword) {
        setInputError(confirmPasswordInput, 'Passwords do not match');
        return false;
    }
    
    setInputSuccess(confirmPasswordInput);
    return true;
}

/**
 * Check if email format is valid
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Set input field error state
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function setInputError(input, message) {
    input.style.borderColor = '#f56565';
    input.style.boxShadow = '0 0 0 3px rgba(245, 101, 101, 0.1)';
    
    // Remove existing error message
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.style.color = '#f56565';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '6px';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Set input field success state
 * @param {HTMLElement} input - Input element
 */
function setInputSuccess(input) {
    input.style.borderColor = '#38a169';
    input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.1)';
    
    // Remove existing error message
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Reset form validation states
 */
function resetFormValidation() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        const errorDiv = input.parentNode.querySelector('.input-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    });
}

/**
 * Load users from JSON file
 */
async function loadUsers() {
    try {
        // In a real application, this would be an API call
        // For now, we'll use localStorage as a fallback
        const storedUsers = localStorage.getItem('splitBillUsers');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
            console.log(`Loaded ${users.length} users from storage`);
        } else {
            // Create default users for testing
            users = [
                {
                    id: '1',
                    username: 'demo',
                    email: 'demo@example.com',
                    password: 'demo123',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    lastLogin: null
                }
            ];
            await saveUsers();
            console.log('Created default demo user');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
    }
}

/**
 * Save users to JSON file
 */
async function saveUsers() {
    try {
        // In a real application, this would be an API call
        // For now, we'll use localStorage as a fallback
        localStorage.setItem('splitBillUsers', JSON.stringify(users));
        console.log(`Saved ${users.length} users to storage`);
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

/**
 * Check if user is already logged in
 */
function checkExistingSession() {
    // Check localStorage first (remember me)
    const storedUser = localStorage.getItem('splitBillUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            console.log('User found in localStorage:', currentUser.username);
            redirectToMainApp();
            return;
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('splitBillUser');
        }
    }
    
    // Check sessionStorage (temporary session)
    const sessionUser = sessionStorage.getItem('splitBillUser');
    if (sessionUser) {
        try {
            currentUser = JSON.parse(sessionUser);
            console.log('User found in sessionStorage:', currentUser.username);
            redirectToMainApp();
            return;
        } catch (error) {
            console.error('Error parsing session user:', error);
            sessionStorage.removeItem('splitBillUser');
        }
    }
}

/**
 * Redirect to main application
 */
function redirectToMainApp() {
    console.log('Redirecting to main application...');
    window.location.href = 'index.html';
}

/**
 * Show alert message
 * @param {string} containerId - ID of alert container
 * @param {string} message - Alert message
 * @param {string} type - Alert type ('error' or 'success')
 */
function showAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    container.style.display = 'block';
    
    // Auto-hide success alerts after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

/**
 * Clear all alerts
 */
function clearAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.parentElement.style.display = 'none';
    });
}

/**
 * Set button loading state
 * @param {string} buttonId - ID of button to update
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        button.disabled = false;
    }
}

/**
 * Show success modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 */
function showSuccessModal(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    successModal.classList.add('active');
}

/**
 * Close success modal
 */
function closeSuccessModal() {
    successModal.classList.remove('active');
}

/**
 * Logout current user
 */
function logout() {
    console.log('Logging out user:', currentUser?.username);
    
    // Clear user data
    currentUser = null;
    localStorage.removeItem('splitBillUser');
    sessionStorage.removeItem('splitBillUser');
    
    // Redirect to auth page
    window.location.href = 'auth.html';
}

// Export functions for use in other files
window.authSystem = {
    logout,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => !!currentUser
};
