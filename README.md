# Split Bill Calculator - Authentication System

A complete authentication system for the Split Bill Calculator project, featuring user registration, login, and secure data persistence.

## 🚀 Features

### Authentication Features
- **User Registration**: Create new accounts with username, email, and password
- **User Login**: Secure authentication with session management
- **Form Validation**: Real-time input validation with helpful error messages
- **Session Management**: Remember me functionality and secure session storage
- **Responsive Design**: Mobile-friendly interface that works on all devices

### Technical Features
- **Vanilla JavaScript**: No frameworks required, pure ES6+ JavaScript
- **Node.js Backend**: Simple Express server for data persistence
- **JSON File Storage**: User data stored in local JSON files
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error handling and user feedback

## 📁 Project Structure

```
split-bill-calculator/
├── auth.html          # Authentication page (Sign In/Sign Up)
├── auth.css           # Authentication page styles
├── auth.js            # Authentication page JavaScript
├── server.js          # Node.js Express server
├── package.json       # Node.js dependencies
├── users.json         # User data storage (auto-created)
├── index.html         # Main application (existing)
├── index.css          # Main application styles (existing)
└── README.md          # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### Step 3: Access the Application
- **Authentication Page**: `http://localhost:3000/auth.html`
- **Main Application**: `http://localhost:3000/index.html`

## 🔐 Default Login Credentials

For testing purposes, a demo account is automatically created:

- **Username**: `demo`
- **Password**: `demo123`
- **Email**: `demo@example.com`

## 📱 Usage

### Sign Up Process
1. Navigate to the authentication page
2. Click "Sign Up" tab
3. Fill in the required fields:
   - Username (3-30 characters, letters/numbers/underscores only)
   - Email address (must be unique)
   - Password (minimum 8 characters)
   - Confirm password
   - Agree to terms and conditions
4. Click "Create Account"
5. Account will be created and stored in `users.json`

### Sign In Process
1. Navigate to the authentication page
2. Click "Sign In" tab
3. Enter your username and password
4. Optionally check "Remember me" for persistent login
5. Click "Sign In"
6. Upon successful authentication, you'll be redirected to the main application

### Session Management
- **Remember Me**: Stores login in localStorage (persistent)
- **Regular Login**: Stores login in sessionStorage (temporary)
- **Auto-redirect**: Automatically redirects to main app if already logged in

## 🎨 Customization

### Styling
The authentication system uses the same design theme as your main application:
- Dark gradient background
- Teal accent colors (#4fd1c7)
- Glassmorphism effects
- Responsive design

### Colors
```css
/* Primary Colors */
--primary: #4fd1c7;
--primary-dark: #38b2ac;
--background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);

/* Text Colors */
--text-primary: #e2e8f0;
--text-secondary: #a0aec0;
--text-dark: #2c3e50;
```

### Validation Rules
```javascript
// Username: 3-30 characters, alphanumeric + underscore
/^[a-zA-Z0-9_]+$/

// Email: Standard email format
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password: Minimum 8 characters
password.length >= 8
```

## 🔧 API Endpoints

The Node.js server provides the following REST API endpoints:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/verify` - Verify user session

### User Management
- `GET /api/users` - Get all users (admin only)

### Request/Response Examples

#### Sign Up
```javascript
POST /api/auth/signup
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123"
}

// Response
{
  "message": "User created successfully",
  "user": {
    "id": "1703123456789",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Sign In
```javascript
POST /api/auth/signin
{
  "username": "john_doe",
  "password": "securepass123"
}

// Response
{
  "message": "Login successful",
  "user": {
    "id": "1703123456789",
    "username": "john_doe",
    "email": "john@example.com",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🚨 Security Considerations

### Current Implementation
- Passwords are stored in plain text (for demo purposes)
- No rate limiting on authentication attempts
- Basic input validation

### Production Recommendations
- **Password Hashing**: Use bcrypt or similar for password storage
- **JWT Tokens**: Implement JWT for secure session management
- **Rate Limiting**: Add rate limiting to prevent brute force attacks
- **HTTPS**: Use HTTPS in production
- **Input Sanitization**: Implement more robust input validation
- **Environment Variables**: Store sensitive configuration in environment variables

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
- Check if port 3000 is already in use
- Ensure Node.js version is 14.0.0 or higher
- Verify all dependencies are installed

#### Authentication Fails
- Check browser console for JavaScript errors
- Verify server is running on correct port
- Check network tab for failed API requests

#### Users Not Saving
- Ensure `users.json` file is writable
- Check server console for file system errors
- Verify proper file permissions

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
DEBUG=* npm start
```

## 📝 Development

### Adding New Features
1. Modify `auth.js` for frontend logic
2. Update `server.js` for backend API changes
3. Adjust `auth.css` for styling changes
4. Test thoroughly on different devices

### File Structure Best Practices
- Keep authentication logic separate from main application
- Use consistent naming conventions
- Implement proper error handling
- Add comprehensive logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Check the server console for backend errors
4. Create an issue in the repository

---

**Note**: This authentication system is designed for development and demonstration purposes. For production use, implement proper security measures as outlined in the security considerations section.
