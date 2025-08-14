/**
 * Simple Node.js Server for Split Bill Calculator Authentication
 * Handles user data persistence using JSON files
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');

/**
 * Initialize users.json file if it doesn't exist
 */
async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
        console.log('Users file exists');
    } catch (error) {
        // Create default users file
        const defaultUsers = [
            {
                id: '1',
                username: 'demo',
                email: 'demo@example.com',
                password: 'demo123',
                createdAt: '2024-01-01T00:00:00.000Z',
                lastLogin: null
            }
        ];
        
        await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
        console.log('Created default users file');
    }
}

/**
 * Load users from JSON file
 */
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

/**
 * Save users to JSON file
 */
async function saveUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

// Routes

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

/**
 * POST /api/auth/signup - User registration
 */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be 3-30 characters' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Load existing users
        const users = await loadUsers();
        
        // Check for duplicate username
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Check for duplicate email
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // In production, hash this password
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        // Add user and save
        users.push(newUser);
        await saveUsers(users);
        
        // Return user without password
        const { password: _, ...safeUser } = newUser;
        res.status(201).json({ 
            message: 'User created successfully',
            user: safeUser
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * POST /api/auth/signin - User login
 */
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Load users and find matching user
        const users = await loadUsers();
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        await saveUsers(users);
        
        // Return user without password
        const { password: _, ...safeUser } = user;
        res.json({ 
            message: 'Login successful',
            user: safeUser
        });
        
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
});

/**
 * GET /api/auth/verify - Verify user session
 */
app.get('/api/auth/verify', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        const users = await loadUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user without password
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser });
        
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Failed to verify user' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeUsersFile();
    console.log('Split Bill Calculator Authentication Server ready!');
});

module.exports = app;
