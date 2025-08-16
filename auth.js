/**
 * Authentication System for Split Bill Calculator
 * Frontend: vanilla JS
 * Backend: Node.js + Express storing users in users.json and session in session.json
 */

// Global state
let currentForm = 'signin';
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing authentication system...');
    
    // Debug: Check initial form states
    console.log('Initial SignIn form classes:', signInForm.className);
    console.log('Initial SignUp form classes:', signUpForm.className);
    console.log('Initial SignIn toggle classes:', signInToggle.className);
    console.log('Initial SignUp toggle classes:', signUpToggle.className);
    
    setupEventListeners();
    await checkExistingSession();
    
    // Check server connection status
    await checkServerConnection();
    
    // Debug: Check form states after setup
    console.log('After setup - SignIn form classes:', signInForm.className);
    console.log('After setup - SignUp form classes:', signUpForm.className);
    
    loading.style.display = 'none';
    authContainer.style.display = 'flex';
    
    // Ensure Sign In form is active by default
    switchForm('signin');
});

/**
 * Set up all event listeners for forms and buttons
 */
function setupEventListeners() {
    // Form submissions
    signInForm.addEventListener('submit', handleSignIn);
    signUpForm.addEventListener('submit', handleSignUp);
    
    // Toggle button click events
    signInToggle.addEventListener('click', () => {
        console.log('Sign In toggle clicked');
        switchForm('signin');
    });
    
    signUpToggle.addEventListener('click', () => {
        console.log('Sign Up toggle clicked');
        switchForm('signup');
    });
    
    // Input validation on blur
    document.getElementById('signUpName').addEventListener('blur', validateName);
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
    console.log('Before switch - SignIn form classes:', signInForm.className);
    console.log('Before switch - SignUp form classes:', signUpForm.className);
    
    // Update toggle buttons
    if (formType === 'signin') {
        signInToggle.classList.add('active');
        signUpToggle.classList.remove('active');
        signInForm.classList.add('active');
        signUpForm.classList.remove('active');
        currentForm = 'signin';
        console.log('Switched to Sign In form');
    } else {
        signUpToggle.classList.add('active');
        signInToggle.classList.remove('active');
        signUpForm.classList.add('active');
        signInForm.classList.remove('active');
        currentForm = 'signup';
        console.log('Switched to Sign Up form');
    }
    
    console.log('After switch - SignIn form classes:', signInForm.className);
    console.log('After switch - SignUp form classes:', signUpForm.className);
    console.log('Current form:', currentForm);
    
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
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate inputs
    if (!email || !password) {
        showAlert('signInAlert', 'Please fill in all fields', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showAlert('signInAlert', 'Please enter a valid email', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading('signInBtn', true);
    
    try {
        // Use absolute URL to localhost server when accessing auth.html directly
        const apiBase = window.location.hostname === 'localhost' && window.location.port === '3000' 
            ? '' 
            : 'http://localhost:3000';
            
        const response = await fetch(`${apiBase}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember: !!rememberMe })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || 'Failed to sign in');
        }

        currentUser = data.user;

        // Optional client-side session mirror
        try {
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('splitBillUser', JSON.stringify(currentUser));
        } catch (_) {}

        showAlert('signInAlert', `Welcome back, ${currentUser.name || currentUser.email}!`, 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    } catch (error) {
        console.error('Sign in error:', error);
        showAlert('signInAlert', error.message || 'An error occurred. Please try again.', 'error');
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
    const name = document.getElementById('signUpName').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validate all inputs
    if (!validateAllSignUpFields(name, email, password, confirmPassword, agreeTerms)) {
        return;
    }
    
    // Show loading state
    setButtonLoading('signUpBtn', true);
    
    try {
        const requestBody = { name, email, password };
        console.log('Sending signup request:', { ...requestBody, password: '[HIDDEN]' });
        
        // Use absolute URL to localhost server when accessing auth.html directly
        const apiBase = window.location.hostname === 'localhost' && window.location.port === '3000' 
            ? '' 
            : 'http://localhost:3000';
            
        const response = await fetch(`${apiBase}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Parsed response data:', data);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            console.error('Raw response text:', responseText);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            throw new Error(data?.error || 'Failed to create account');
        }

        showSuccessModal('Account Created!', `Welcome to Split Bill Calculator, ${name}! Your account has been created successfully.`);
        signUpForm.reset();
        setTimeout(() => { switchForm('signin'); }, 1200);
        
    } catch (error) {
        console.error('Sign up error:', error);
        showAlert('signUpAlert', error.message || 'An error occurred while creating your account. Please try again.', 'error');
    } finally {
        setButtonLoading('signUpBtn', false);
    }
}

/**
 * Validate all Sign Up form fields
 * @param {string} name - Full name input
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @param {string} confirmPassword - Confirm password input
 * @param {boolean} agreeTerms - Terms agreement checkbox
 * @returns {boolean} - True if all validations pass
 */
function validateAllSignUpFields(name, email, password, confirmPassword, agreeTerms) {
    let isValid = true;
    
    // Name validation
    if (!name) {
        showAlert('signUpAlert', 'Full name is required', 'error');
        document.getElementById('signUpName').focus();
        isValid = false;
    } else if (name.length < 2 || name.length > 60) {
        showAlert('signUpAlert', 'Full name must be between 2 and 60 characters', 'error');
        document.getElementById('signUpName').focus();
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
    } else if (password.length < 6) {
        showAlert('signUpAlert', 'Password must be at least 6 characters long', 'error');
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
 * Validate full name input
 */
function validateName() {
    const name = document.getElementById('signUpName').value.trim();
    const nameInput = document.getElementById('signUpName');
    if (!name) {
        setInputError(nameInput, 'Full name is required');
        return false;
    }
    if (name.length < 2 || name.length > 60) {
        setInputError(nameInput, 'Full name must be between 2 and 60 characters');
        return false;
    }
    setInputSuccess(nameInput);
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
 * Check server connection status
 */
async function checkServerConnection() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    try {
        // Determine API base URL
        const apiBase = window.location.hostname === 'localhost' && window.location.port === '3000' 
            ? '' 
            : 'http://localhost:3000';
        
        // Try to ping the server
        const response = await fetch(`${apiBase}/api/auth/session`, { 
            method: 'GET',
            timeout: 3000 // 3 second timeout
        });
        
        if (response.ok) {
            statusIndicator.className = 'status-indicator connected';
            statusText.textContent = 'Server connected';
            console.log('✅ Server connection successful');
            
            // Hide setup instructions when connected
            document.getElementById('setupInstructions').style.display = 'none';
        } else {
            throw new Error('Server responded with error');
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Server disconnected - Start local server first';
        console.error('❌ Server connection failed:', error);
        
        // Show warning to user
        showAlert('signInAlert', '⚠️ Please start the local server first: node server.js', 'error');
        showAlert('signUpAlert', '⚠️ Please start the local server first: node server.js', 'error');
        
        // Show setup instructions
        document.getElementById('setupInstructions').style.display = 'block';
    }
}

/**
 * Check if user is already logged in
 */
async function checkExistingSession() {
    // Prefer backend session
    try {
        // Use absolute URL to localhost server when accessing auth.html directly
        const apiBase = window.location.hostname === 'localhost' && window.location.port === '3000' 
            ? '' 
            : 'http://localhost:3000';
            
        const res = await fetch(`${apiBase}/api/auth/session`);
        if (res.ok) {
            const session = await res.json();
            if (session && session.userId) {
                redirectToMainApp();
                return;
            }
        }
    } catch (_) {}
    // Fallback to client storage
    const storedUser = localStorage.getItem('splitBillUser') || sessionStorage.getItem('splitBillUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            redirectToMainApp();
        } catch (_) {}
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
    console.log('Logging out user');
    currentUser = null;
    localStorage.removeItem('splitBillUser');
    sessionStorage.removeItem('splitBillUser');
            // Use absolute URL to localhost server when accessing auth.html directly
        const apiBase = window.location.hostname === 'localhost' && window.location.port === '3000' 
            ? '' 
            : 'http://localhost:3000';
            
        fetch(`${apiBase}/api/auth/signout`, { method: 'POST' }).finally(() => {
        window.location.href = 'auth.html';
    });
}

// Export functions for use in other files
window.authSystem = {
    logout,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => !!currentUser
};
