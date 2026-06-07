# 🔐 Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials (5 minutes)

1. Go to: https://console.cloud.google.com/
2. Create a new project:
   - Click "Select a Project" → "New Project"
   - Name: "HR Attendance App"
   - Click "Create"

3. Enable Google+ API:
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add "Authorized JavaScript origins":
     - `http://localhost:5000`
     - `http://127.0.0.1:5000`
   - Add "Authorized redirect URIs":
     - `http://localhost:5000/auth/google/callback`
     - `http://127.0.0.1:5000/auth/google/callback`
   - Click "Create"
   - Copy your `Client ID` and `Client Secret`

## Step 2: Update .env File

1. Create `.env` file in your project folder (copy from `.env.example`)
2. Fill in Google credentials:
   ```
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-random-secret-key
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

## Step 3: Install New Dependencies

Since we added OAuth libraries, run:
```bash
npm install
```

## Step 4: Start Server

```bash
npm start
```

You should see:
```
Server running on http://localhost:5000
Database: ./hr_attendance.db

Google OAuth Setup:
GOOGLE_CLIENT_ID: ✓ Set
GOOGLE_CLIENT_SECRET: ✓ Set
```

## Step 5: Open Both Interfaces

**Admin Dashboard (For You):**
- Open `admin.html` in your browser
- Full control: manage workers, view reports, approve leaves

**Worker Interface (For Employees):**
- Open `worker.html` in your browser
- They'll see a Google login button
- Once logged in: check-in button + leave requests

## Troubleshooting

**Error: "OAuth credentials not set"**
- Check `.env` file has correct GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Restart the server after changing .env

**"Invalid redirect URI"**
- Make sure the redirect URI in Google Console matches exactly:
  - `http://localhost:5000/auth/google/callback`

**Workers can't login**
- Make sure they click the Google login button on `worker.html`
- Only authenticated workers can check-in and request leaves

**Different computers?**
- Change `localhost` to your server's IP:
  - Example: `http://192.168.1.100:5000`
  - Update this in both HTML files (API_URL variable)
  - Update Google OAuth redirect URIs as well

---

## File Changes Summary

- `server.js` - Added OAuth routes & authentication
- `package.json` - Added passport, passport-google-oauth20, express-session
- `.env.example` - Added Google OAuth fields
- `worker.html` - NEW: Worker interface with login
- `admin.html` - RENAMED from `frontend.html` (unchanged logic)

---

## Architecture

```
User (Worker)
  ↓
worker.html (Google Login)
  ↓
/auth/google (Passport.js)
  ↓
users table (Google ID stored)
  ↓
workers table (linked to user)
  ↓
check-ins & leaves (user-specific data)

Admin (You)
  ↓
admin.html (full access)
  ↓
All APIs (no auth required yet - can add later)
```

---

## Future Improvements

- Add **Microsoft/Azure AD** SSO alongside Google
- Add **LDAP/Active Directory** for enterprise
- Add two-factor authentication (2FA)
- Add user profile page with settings
- Email notifications for leave requests
- Biometric check-in support
