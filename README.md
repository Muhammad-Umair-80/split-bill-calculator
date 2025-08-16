# Split Bill Calculator with Google OAuth2

A Node.js application that combines a split bill calculator with Google OAuth2 authentication.

## Features

- **Google OAuth2 Sign-in**: Secure authentication using Google accounts
- **Split Bill Calculator**: Calculate bill splits, tips, and random payer assignment
- **User Management**: Automatic user creation and profile management
- **Session Management**: Persistent login sessions using express-session
- **Modern UI**: Clean, responsive interface for both authentication and calculator

## Prerequisites

- Node.js (version 14 or higher)
- Google Cloud Console project with OAuth2 credentials
- Google OAuth2 client credentials file

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Google OAuth2 Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set up OAuth consent screen
6. Choose "Web application" as the application type
7. Add authorized JavaScript origins: `http://localhost:3000`
8. Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
9. Download the credentials JSON file
10. Rename it to `client_secret_1009038599977-7k9rklbaiu5t6ofsk9vr32lrp4nqa6tj.apps.googleusercontent.com.json` and place it in the project root

### 3. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

### Authentication Flow

1. **Home Page** (`/`): Displays "Sign in with Google" button
2. **Google OAuth** (`/auth/google`): Redirects to Google's authentication page
3. **Callback** (`/auth/google/callback`): Handles Google's response and creates/updates user
4. **Dashboard** (`/dashboard`): Protected page showing user profile and information
5. **Logout** (`/logout`): Ends session and returns to home page

### User Management

- Users are automatically created on first Google sign-in
- User information is stored in `users.json`
- Duplicate users are prevented by email address
- Profile pictures, names, and login timestamps are tracked

### Calculator Features

- **Basic Calculator**: Standard arithmetic operations
- **Simple Calculator**: Bill splitting with tip calculation
- **Split Share**: Advanced bill splitting with individual amounts

## API Endpoints

- `GET /` - Home page with sign-in
- `GET /auth/google` - Start Google OAuth process
- `GET /auth/google/callback` - Handle OAuth callback
- `GET /dashboard` - Protected user dashboard
- `GET /logout` - End user session
- `GET /api/users` - Get all users (admin)
- `GET /api/auth/session` - Get current session info

## File Structure

```
split-bill-calculator/
├── server.js                                    # Main server with OAuth integration
├── package.json                                 # Dependencies and scripts
├── users.json                                   # User data storage
├── client_secret_*.json                        # Google OAuth credentials
├── index.html                                   # Main calculator interface
├── index.css                                    # Calculator styles
├── auth.html                                    # Authentication page
├── auth.css                                     # Authentication styles
└── README.md                                    # This file
```

## Security Features

- Session-based authentication
- Secure cookie handling
- OAuth2 token verification
- User data validation
- CSRF protection through session tokens

## Development

### Environment Variables

You can customize the following by setting environment variables:

- `PORT`: Server port (default: 3000)
- Session secret (change in production)

### Adding New Features

1. Add new routes in `server.js`
2. Create corresponding HTML/CSS files
3. Update the navigation if needed
4. Test authentication flow

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Check Google Cloud Console redirect URI settings
2. **"Client ID not found"**: Verify credentials file is in the correct location
3. **Session not persisting**: Check cookie settings and session configuration
4. **Port already in use**: Change PORT environment variable or kill existing process

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=passport:* npm start
```

## Production Deployment

Before deploying to production:

1. Change session secret to a secure random string
2. Set `secure: true` for cookies (HTTPS required)
3. Use environment variables for sensitive configuration
4. Set up proper HTTPS certificates
5. Update Google OAuth redirect URIs to production domain
6. Implement proper error handling and logging

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify Google OAuth configuration
3. Check server logs for error messages
4. Ensure all dependencies are properly installed
