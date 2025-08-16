# 🔐 Split Bill Calculator - Authentication Setup Guide

## 🚀 Quick Start

### Option 1: Access via Local Server (Recommended)
1. **Start the server:**
   ```bash
   node server.js
   ```
2. **Visit:** `http://localhost:3000`
3. **Create account** and start using the app!

### Option 2: Access auth.html Directly
1. **Start the server:**
   ```bash
   node server.js
   ```
2. **Open `auth.html`** in your browser (double-click or use Live Server)
3. **The page will automatically connect** to your local server
4. **Create account** and start using the app!

## 📁 File Structure
```
split-bill-calculator/
├── server.js          # Node.js server (must be running)
├── auth.html          # Authentication page
├── auth.css           # Authentication styles
├── auth.js            # Authentication logic
├── users.json         # User data storage
└── index.html         # Main calculator app
```

## 🔧 How It Works

### Frontend (auth.html)
- **Static HTML file** that can be opened directly in browser
- **Automatically detects** if running on localhost:3000 or elsewhere
- **Connects to local server** at `http://localhost:3000` for API calls
- **Shows connection status** and setup instructions

### Backend (server.js)
- **Node.js Express server** running on port 3000
- **Handles user registration** and authentication
- **Stores user data** in `users.json` file
- **Manages sessions** and user state

## 🌐 Deployment Options

### ❌ GitHub Pages (Not Supported)
- **Cannot run Node.js servers**
- **No file system access** for saving data
- **Only static files** are supported

### ✅ Local Development
- **Full functionality** with local server
- **Data persistence** in users.json
- **Session management** working
- **Perfect for development** and testing

### ✅ VPS/Cloud Hosting
- **Deploy server.js** to cloud server
- **Update API URLs** in auth.js
- **Full production** functionality

## 🚨 Troubleshooting

### "Server disconnected" Error
1. **Check if server is running:**
   ```bash
   node server.js
   ```
2. **Look for:** "Server running on port 3000"
3. **Refresh the page** to reconnect

### "Invalid response from server" Error
1. **Check server console** for error messages
2. **Ensure users.json** is writable
3. **Restart server** if needed

### Port Already in Use
1. **Kill existing process:**
   ```bash
   taskkill /F /IM node.exe
   ```
2. **Or change port** in server.js:
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```

## 📱 Usage Flow

1. **User opens auth.html** (directly or via localhost:3000)
2. **Page checks server connection** and shows status
3. **User creates account** → Data saved to users.json
4. **User signs in** → Session created
5. **Redirected to calculator** → Full app functionality

## 🔒 Security Notes

- **Change session secret** in production
- **Use HTTPS** in production
- **Validate all inputs** (already implemented)
- **Hash passwords** (using bcrypt)
- **Rate limiting** recommended for production

## 🎯 Next Steps

1. **Test the system** locally first
2. **Create some test accounts**
3. **Verify data** is saved in users.json
4. **Deploy to cloud** if needed for production use

---

**Need help?** Check the server console for detailed error messages and debugging information!
