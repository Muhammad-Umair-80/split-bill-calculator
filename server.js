/**
 * Node.js Server with Google OAuth2 Integration
 * Handles Google sign-in, user management, and session handling
 * Also supports traditional email/password authentication
 */

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const CREDENTIALS_FILE = path.join(__dirname, 'client_secret_1009038599977-7k9rklbaiu5t6ofsk9vr32lrp4nqa6tj.apps.googleusercontent.com.json');

/**
 * Initialize users.json file if it doesn't exist
 */
async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
        console.log('Users file exists');
    } catch (error) {
        // Create empty users file
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
        console.log('Created empty users file');
    }
}

/**
 * Load users from JSON file
 */
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        if (!data || data.trim() === '') {
            console.log('Users file is empty, returning empty array');
            return [];
        }
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
            console.log('Users file does not contain an array, returning empty array');
            return [];
        }
        return parsed;
    } catch (error) {
        console.error('Error loading users:', error);
        // If there's an error reading the file, try to create a new one
        try {
            await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
            console.log('Created new users file due to error');
            return [];
        } catch (writeError) {
            console.error('Failed to create new users file:', writeError);
            return [];
        }
    }
}

/**
 * Save users to JSON file
 */
async function saveUsers(users) {
    try {
        if (!Array.isArray(users)) {
            console.error('Invalid users data - not an array:', users);
            return false;
        }
        
        const jsonData = JSON.stringify(users, null, 2);
        await fs.writeFile(USERS_FILE, jsonData);
        console.log(`Successfully saved ${users.length} users to file`);
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        console.error('Error stack:', error.stack);
        return false;
    }
}

/**
 * Add or update user in users.json (Google OAuth)
 * Avoids duplicates by email
 */
async function addOrUpdateGoogleUser(googleProfile) {
    try {
        const users = await loadUsers();
        
        // Check if user already exists
        const existingUserIndex = users.findIndex(user => 
            user.email === googleProfile.email
        );
        
        if (existingUserIndex !== -1) {
            // Update existing user
            users[existingUserIndex] = {
                ...users[existingUserIndex],
                name: googleProfile.name,
                picture: googleProfile.picture,
                lastLogin: new Date().toISOString(),
                googleId: googleProfile.googleId
            };
        } else {
            // Add new user
            const newUser = {
                id: Date.now().toString(),
                googleId: googleProfile.googleId,
                name: googleProfile.name,
                email: googleProfile.email,
                picture: googleProfile.picture,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            users.push(newUser);
        }
        
        await saveUsers(users);
        return existingUserIndex !== -1 ? users[existingUserIndex] : users[users.length - 1];
    } catch (error) {
        console.error('Error adding/updating Google user:', error);
        throw error;
    }
}

/**
 * Load Google OAuth credentials
 */
async function loadGoogleCredentials() {
    try {
        const data = await fs.readFile(CREDENTIALS_FILE, 'utf8');
        const credentials = JSON.parse(data);
        
        if (!credentials.web || !credentials.web.client_id || !credentials.web.client_secret) {
            throw new Error('Invalid credentials file format');
        }
        
        return {
            clientID: credentials.web.client_id,
            clientSecret: credentials.web.client_secret
        };
    } catch (error) {
        console.error('Error loading Google credentials:', error);
        throw error;
    }
}

/**
 * Configure Google OAuth Strategy
 */
async function configureGoogleStrategy() {
    try {
        const credentials = await loadGoogleCredentials();
        
        passport.use(new GoogleStrategy({
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
            callbackURL: "http://localhost:3000/auth/google/callback"
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const googleProfile = {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    picture: profile.photos[0].value
                };
                
                // Add or update user in our database
                const user = await addOrUpdateGoogleUser(googleProfile);
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }));
        
        console.log('Google OAuth strategy configured successfully');
    } catch (error) {
        console.error('Failed to configure Google OAuth strategy:', error);
        console.log('Google OAuth will be disabled - continuing with traditional auth only');
    }
}

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const users = await loadUsers();
        const user = users.find(u => u.id === id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Routes

/**
 * GET / - Serve the existing auth.html file
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

/**
 * GET /auth/google - Start Google OAuth process
 */
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

/**
 * GET /auth/google/callback - Handle Google OAuth callback
 */
app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/',
        failureFlash: true
    }),
    (req, res) => {
        // Successful authentication, redirect to dashboard
        res.redirect('/dashboard');
    }
);

/**
 * GET /dashboard - Protected dashboard page
 */
app.get('/dashboard', isAuthenticated, (req, res) => {
    const user = req.user;
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Split Bill Calculator</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .profile-pic {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .user-details h2 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .user-details p {
                    margin: 5px 0;
                    color: #666;
                }
                .logout-btn {
                    background: #dc3545;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 14px;
                    transition: background-color 0.3s;
                }
                .logout-btn:hover {
                    background: #c82333;
                }
                .welcome-message {
                    background: #e8f5e8;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 30px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }
                .stat-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                }
                .stat-number {
                    font-size: 2em;
                    font-weight: bold;
                    color: #007bff;
                }
                .stat-label {
                    color: #666;
                    margin-top: 5px;
                }
                .calculator-link {
                    background: #007bff;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 16px;
                    display: inline-block;
                    margin-top: 20px;
                    transition: background-color 0.3s;
                }
                .calculator-link:hover {
                    background: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="user-info">
                        <img src="${user.picture || 'https://via.placeholder.com/80x80?text=User'}" 
                             alt="Profile Picture" 
                             class="profile-pic">
                        <div class="user-details">
                            <h2>${user.name}</h2>
                            <p>${user.email}</p>
                            <p>Member since: ${new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <a href="/logout" class="logout-btn">Logout</a>
                </div>
                
                <div class="welcome-message">
                    <h3>Welcome back, ${user.name}!</h3>
                    <p>You're successfully signed in. Your account is ready to use.</p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</div>
                        <div class="stat-label">Last Login</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${user.id}</div>
                        <div class="stat-label">User ID</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${user.googleId ? 'Yes' : 'No'}</div>
                        <div class="stat-label">Google Account</div>
                    </div>
                </div>
                
                <a href="/calculator" class="calculator-link">Go to Split Bill Calculator</a>
            </div>
        </body>
        </html>
    `);
});

/**
 * GET /calculator - Serve the main calculator application
 */
app.get('/calculator', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * GET /logout - Destroy session and redirect to home
 */
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// Traditional Authentication API Routes (keeping your existing system)

/**
 * POST /api/auth/signup - User registration
 */
app.post('/api/auth/signup', async (req, res) => {
    console.log('=== SIGNUP REQUEST START ===');
    console.log('Signup request received:', { body: req.body, headers: req.headers });
    
    try {
        const { name, email, password } = req.body;
        console.log('Extracted data:', { name, email, password: password ? '[HIDDEN]' : 'undefined' });
        
        // Validation
        if (!name || !email || !password) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            console.log('Validation failed - password too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        console.log('Validation passed, loading users...');
        
        // Load existing users
        const users = await loadUsers();
        console.log('Loaded users:', users.length);
        
        // Check for duplicate email
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            console.log('Duplicate email found');
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        console.log('No duplicate email, hashing password...');
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed successfully');

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        console.log('New user created, saving...');
        
        // Add user and save
        users.push(newUser);
        const saveResult = await saveUsers(users);
        
        if (!saveResult) {
            console.error('Failed to save user to file');
            return res.status(500).json({ error: 'Failed to save user data' });
        }
        
        console.log('User saved successfully');
        
        // Return user without password
        const { password: _, ...safeUser } = newUser;
        console.log('Sending response:', { message: 'User created successfully', user: safeUser });
        
        // Ensure we're sending a proper JSON response
        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({ 
            message: 'User created successfully',
            user: safeUser
        });
        
        console.log('=== SIGNUP REQUEST SUCCESS ===');
        
    } catch (error) {
        console.error('=== SIGNUP REQUEST ERROR ===');
        console.error('Signup error:', error);
        console.error('Error stack:', error.stack);
        
        // Ensure we send a proper error response
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * POST /api/auth/signin - User login
 */
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Load users and find matching user
        const users = await loadUsers();
        const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user has password (Google OAuth users might not)
        if (!user.password) {
            return res.status(401).json({ error: 'This account was created with Google. Please use Google Sign-In.' });
        }

        // Compare password
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        await saveUsers(users);
        
        // Create session
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create session' });
            }
            
            // Return user without password
            const { password: _, ...safeUser } = user;
            res.json({ 
                message: 'Login successful',
                user: safeUser
            });
        });
        
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
});

/**
 * GET /api/auth/session - Get current session info
 */
app.get('/api/auth/session', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.status(401).json({
            authenticated: false,
            message: 'Not authenticated'
        });
    }
});

/**
 * GET /api/users - Get all users (for admin purposes)
 */
app.get('/api/users', async (req, res) => {
    try {
        const users = await loadUsers();
        // Remove passwords from response
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load users' });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler caught:', error);
    console.error('Error stack:', error.stack);
    
    // Don't send error details in production
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Serve static files after all routes
app.use(express.static('.'));

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeUsersFile();
    await configureGoogleStrategy();
    console.log('Authentication Server ready!');
    console.log(`Visit http://localhost:${PORT} to access the authentication system`);
});

module.exports = app;




