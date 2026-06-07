# Impactrack HR - Railway Deployment Guide

Your app will be deployed to Railway at: **https://impactrack-hr.up.railway.app** (exact URL after deployment)

Railway is like Heroku but **no credit card required**. It's simple and perfect for company apps.

---

## Step 1: Create a Railway Account

1. Go to https://railway.app
2. Click **"Start Free"** or **"Sign Up"**
3. Choose **GitHub** to sign up (or email)
   - If using GitHub, you'll need to create a GitHub account first
4. Verify your email

---

## Step 2: Push Your Code to GitHub

Railway works best with GitHub. You need to push your code there first.

### Create GitHub Account (if you don't have one)
1. Go to https://github.com/signup
2. Create account with your work email
3. Verify email

### Push Your Code to GitHub

In PowerShell, run these exact commands:

```bash
cd "C:\Users\oran\OneDrive\Documents\Claude\Projects\worker place"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/impactrack-hr.git
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## Step 3: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Authorize Railway to access your GitHub account
5. Select the `impactrack-hr` repository
6. Click **"Deploy"**

Railway will automatically detect it's a Node.js app and deploy it!

---

## Step 4: Set Environment Variables on Railway

Once the project is created:

1. Go to your Railway project dashboard
2. Click on the **"impactrack-hr"** deployment
3. Go to the **"Variables"** tab
4. Add these environment variables:

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `SESSION_SECRET` | `openssl rand -hex 32` (generate a random key) |
| `NODE_ENV` | `production` |

**To generate SESSION_SECRET**, run in PowerShell:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Update Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://impactrack-hr.up.railway.app/auth/google/callback
   ```
   (Railway will give you the exact URL after deployment - check your project settings)
6. Save

---

## Step 6: Test Your Deployment

1. Get your Railway app URL from the Railway dashboard
2. Open: `https://your-railway-url/worker.html`
3. Click login with Google
4. You should see the worker dashboard
5. Test the admin dashboard too

---

## Step 7: Share with Your Bosses

Once it's working:
1. Your app is live at the Railway URL
2. Share the links:
   - Admin: `https://your-railway-url/admin.html`
   - Worker: `https://your-railway-url/worker.html`
3. They can login with Google and use the app

---

## Troubleshooting

### "Cannot POST /auth/google/callback"
- Check that the redirect URL in Google Cloud Console matches your Railway URL exactly
- Make sure you added the correct URL with the trailing `/auth/google/callback`

### App won't deploy
- Check the **Logs** tab in Railway dashboard
- Common issues: missing environment variables, Node.js version
- Railway should automatically detect Node.js 18+

### Database not working
- Railway uses ephemeral filesystem (data resets on restart)
- For production, you'd need to add a PostgreSQL database add-on in Railway (free tier available)
- For now, the SQLite database works but restarts will clear data

---

## Next Steps (Optional)

1. **Add Railway PostgreSQL database**
   - Go to Railway dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Update your app to use PostgreSQL instead of SQLite
   - This keeps data persistent

2. **Custom domain**
   - Buy a domain (namecheap.com, etc.)
   - Connect it to Railway
   - Update Google OAuth again

3. **Auto-redeploy on code changes**
   - Railway auto-deploys when you push to GitHub
   - Just use: `git push origin main`

---

## Quick Commands

| Action | Command |
|--------|---------|
| View logs | Railway dashboard → Logs tab |
| Check environment variables | Railway dashboard → Variables tab |
| Redeploy | Push to GitHub: `git push origin main` |
| View deployments | Railway dashboard → Deployments tab |

---

**Questions?** Check Railway docs: https://docs.railway.app
