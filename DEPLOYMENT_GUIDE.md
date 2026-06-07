# Impactrack HR - Heroku Deployment Guide

Your app will be deployed to: **https://impactrack-hr.herokuapp.com**

## Step 1: Prerequisites

### Install Heroku CLI
1. Download from: https://devcenter.heroku.com/articles/heroku-cli
2. Open Terminal/Command Prompt and run:
   ```
   heroku --version
   ```

### Create Heroku Account
1. Go to https://www.heroku.com
2. Sign up for a free account
3. Verify your email

### Login to Heroku
In Terminal, run:
```bash
heroku login
```
This opens a browser to authenticate. Follow the prompts.

---

## Step 2: Prepare App for Production

### Update server.js for Production
Replace the hardcoded localhost with environment variables.

In `server.js`, find the CORS section (around line 73) and update it:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true
}));
```

And the session cookie (around line 84):
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production' ? true : false,
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000
}
```

### Update admin.html and worker.html
Replace hardcoded API URLs with dynamic ones.

In both files, find:
```javascript
const API_URL = 'http://localhost:5000/api';
```

Replace with:
```javascript
const API_URL = window.location.origin + '/api';
```

This makes them use whatever domain they're on.

### Create .gitignore (if not exists)
Create a file named `.gitignore` in your project root with:
```
node_modules/
.env
hr_attendance.db
*.log
```

### Create Procfile
Create a file named `Procfile` (no extension) in your project root with:
```
web: node server.js
```

---

## Step 3: Create Heroku App

In Terminal, navigate to your project folder and run:
```bash
heroku create impactrack-hr
```

Your app URL is now: **https://impactrack-hr.herokuapp.com**

---

## Step 4: Update Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://impactrack-hr.herokuapp.com/auth/google/callback
   ```
6. Save

---

## Step 5: Set Environment Variables on Heroku

Run these commands (replace with your actual credentials):

```bash
heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
heroku config:set SESSION_SECRET=your_random_secret_key
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://impactrack-hr.herokuapp.com
```

**To generate a random SESSION_SECRET**, run in Terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6: Deploy to Heroku

### Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit for production"
```

### Deploy
```bash
git push heroku main
```

(If your branch is called `master` instead of `main`, use `git push heroku master`)

Monitor the deployment:
```bash
heroku logs --tail
```

---

## Step 7: Set Up Production Database

Heroku doesn't include a free SQLite database. We have two options:

### Option A: Use Heroku Postgres (Recommended, has free tier)
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

Then update `server.js` to use Postgres instead of SQLite. Let me provide the updated code.

### Option B: Keep SQLite (Simple, but limited)
SQLite works on Heroku's ephemeral filesystem, but data will be lost when the app restarts. Only use for testing.

**Choose Option A for production data persistence.**

---

## Step 8: Test Your Deployment

1. Open https://impactrack-hr.herokuapp.com/worker.html
2. Click login with Google
3. You should see the worker dashboard
4. Open https://impactrack-hr.herokuapp.com/admin.html
5. Login and verify the admin dashboard works

---

## Step 9: Monitor Your App

View logs:
```bash
heroku logs --tail
```

View all config:
```bash
heroku config
```

Scale dynos (optional, for performance):
```bash
heroku ps:scale web=1
```

---

## Troubleshooting

### "Cannot POST /auth/google/callback"
- Check that Google OAuth redirect URL is updated in Google Cloud Console
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly

### "Cannot GET /worker.html"
- Check that static files are being served correctly
- Restart app: `heroku restart`

### Database errors
- Use `heroku logs --tail` to see errors
- If using SQLite, data may be lost on app restart

### View app info
```bash
heroku apps:info impactrack-hr
```

---

## Next Steps (Optional)

1. **Buy a custom domain** (later)
   - Point to Heroku after purchasing
   - Update Google OAuth redirect URL again

2. **Enable HTTPS** (automatic on Heroku)
   - Already included with Heroku domain

3. **Set up auto-deploy from GitHub**
   - Push to GitHub → Heroku auto-deploys on push

4. **Monitor performance**
   - Use Heroku dashboar at https://dashboard.heroku.com

---

## Quick Reference

| What | Command |
|------|---------|
| View logs | `heroku logs --tail` |
| Set config | `heroku config:set KEY=value` |
| Get config | `heroku config` |
| Restart app | `heroku restart` |
| Open app | `heroku open` |
| Delete app | `heroku apps:destroy impactrack-hr` |

---

**Need help?** Check Heroku docs: https://devcenter.heroku.com
