# OAuth Setup Guide

This guide explains how to enable Google and Apple Sign-In for ShopTheBarber.

## Overview

OAuth (social login) allows users to sign in using their Google or Apple accounts instead of creating a password. The system:

1. **Without OAuth configured**: Buttons show a message that the feature is not configured
2. **With OAuth configured**: Buttons redirect to the provider's login page, then back to your app with authentication

## Google Sign-In Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**

### 2. Configure OAuth Consent Screen

1. Click **OAuth consent screen** in the left sidebar
2. Select **External** user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: ShopTheBarber
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### 3. Create OAuth Client ID

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `ShopTheBarber Web Client`
4. **Authorized redirect URIs**: Add these URLs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://your-backend-domain.com/api/auth/google/callback`
5. Click **Create**
6. **Save the Client ID and Client Secret** — you'll need these for `.env`

### 4. Update Backend Environment

Edit `server/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
BACKEND_URL=http://localhost:3001  # or https://your-backend.com for production
```

### 5. Restart Backend

```bash
cd server
npm run dev
```

You should see: `✅ OAuth configured: Google`

---

## Apple Sign-In Setup

⚠️ **Apple Sign-In requires**:
- An Apple Developer account ($99/year)
- A verified domain for production (development can use localhost)

### 1. Register Your App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** to create a new identifier
3. Select **App IDs** → Continue
4. Select **App** → Continue
5. Fill in:
   - **Description**: ShopTheBarber
   - **Bundle ID**: `com.shopthebarber.app` (or your own)
6. Under **Capabilities**, enable **Sign In with Apple**
7. Click **Continue** → **Register**

### 2. Create a Services ID

1. Go back to **Identifiers** → **+** (create new)
2. Select **Services IDs** → Continue
3. Fill in:
   - **Description**: ShopTheBarber Web
   - **Identifier**: `com.shopthebarber.web` (or your own)
4. Enable **Sign In with Apple**
5. Click **Configure**:
   - **Primary App ID**: Select the App ID you created above
   - **Domains and Subdomains**: Add your backend domain (e.g., `your-backend.com`)
     - For local development: `localhost`
   - **Return URLs**: Add:
     - Development: `http://localhost:3001/api/auth/apple/callback`
     - Production: `https://your-backend.com/api/auth/apple/callback`
6. Click **Save** → **Continue** → **Register**

### 3. Create a Private Key

1. Go to **Keys** → **+** (create new key)
2. **Key Name**: ShopTheBarber Sign In Key
3. Enable **Sign In with Apple**
4. Click **Configure** → Select your **Primary App ID**
5. Click **Save** → **Continue** → **Register**
6. **Download the `.p8` key file** — you can only download it once
7. Note the **Key ID** shown on the page

### 4. Generate Client Secret

Apple Sign-In requires a dynamically generated client secret (a JWT token signed with your private key). You'll need to:

1. Convert the `.p8` key to the format needed
2. Generate a JWT with specific claims

**Option A: Use a helper script** (create `server/scripts/generate-apple-secret.js`):

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const teamId = 'YOUR_TEAM_ID'; // Found in your Apple Developer account
const clientId = 'com.shopthebarber.web'; // Your Services ID
const keyId = 'YOUR_KEY_ID'; // From the key you created
const privateKey = fs.readFileSync('./AuthKey_XXXXX.p8', 'utf8');

const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
    aud: 'https://appleid.apple.com',
    sub: clientId,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  }
);

console.log('Client Secret:', token);
```

Run: `node server/scripts/generate-apple-secret.js`

**Option B: Use an online generator**:
- [Apple Client Secret Generator](https://appleid.apple.com/signinwithapple/token-generator)

### 5. Update Backend Environment

Edit `server/.env`:

```bash
APPLE_CLIENT_ID=com.shopthebarber.web
APPLE_CLIENT_SECRET=eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQ0QxMjM0NTYifQ...
APPLE_TEAM_ID=ABC123DEF4
APPLE_KEY_ID=ABC123DEF4
BACKEND_URL=http://localhost:3001  # or https://your-backend.com
```

### 6. Restart Backend

```bash
cd server
npm run dev
```

You should see: `✅ OAuth configured: Apple`

---

## Testing OAuth

### Development Testing

1. Start the backend: `cd server && npm run dev`
2. Start the frontend: `cd .. && npm run dev`
3. Navigate to `http://localhost:3000/signin`
4. Click **Apple** or **Google** button
5. You should be redirected to the provider's login page
6. After successful login, you'll be redirected back and automatically signed in

### Without OAuth Configured

If you click the social login buttons without setting up OAuth credentials:

- A toast notification will appear: "Google Sign-In is not configured"
- Users can still use email/password authentication

### Production Deployment

**Important**: Update your redirect URIs in both Google and Apple consoles to match your production backend URL:

```
https://your-backend-domain.com/api/auth/google/callback
https://your-backend-domain.com/api/auth/apple/callback
```

Then set the environment variables on your production backend (Render, Heroku, etc.).

---

## How It Works

### OAuth Flow

1. User clicks "Sign in with Google/Apple"
2. Frontend redirects to: `/api/auth/google` or `/api/auth/apple`
3. Backend redirects to provider's OAuth page
4. User authorizes the app
5. Provider redirects back to: `/api/auth/google/callback` or `/api/auth/apple/callback`
6. Backend:
   - Exchanges authorization code for access token
   - Fetches user profile (email, name)
   - Creates or finds user in database
   - Generates JWT token
   - Redirects to: `/auth/callback?token=<jwt>&provider=<google|apple>`
7. Frontend OAuthCallback page:
   - Extracts token from URL
   - Saves token to localStorage
   - Redirects to dashboard

### Database Handling

- If user email exists: Login to existing account
- If user email is new: Create new account with `role: 'client'` and `password_hash: null`
- OAuth users cannot use password login (they must use OAuth to sign in)

### Security Notes

- JWT tokens expire in 7 days (configurable in `server/src/index.ts`)
- OAuth client secrets must be kept secure (never commit to git)
- Backend validates OAuth tokens with the provider
- User email must be verified by the provider (Google/Apple handles this)

---

## Troubleshooting

### "OAuth not configured" message

**Cause**: Environment variables not set or backend not restarted

**Fix**:
1. Verify `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (or Apple equivalents)
2. Restart backend: `cd server && npm run dev`
3. Check logs for: `✅ OAuth configured: Google` or `⚠️  OAuth not configured`

### Redirect URI mismatch error

**Cause**: The callback URL in Google/Apple console doesn't match the one in your `.env`

**Fix**:
1. Check `BACKEND_URL` in `server/.env`
2. Ensure redirect URIs in Google/Apple console exactly match:
   - `{BACKEND_URL}/api/auth/google/callback`
   - `{BACKEND_URL}/api/auth/apple/callback`

### "Authentication failed" after OAuth redirect

**Cause**: Backend couldn't verify the OAuth token or fetch user info

**Fix**:
1. Check backend logs for errors
2. Verify OAuth scopes include `email` and `profile`
3. Ensure your Google/Apple app is not in "testing" mode (or add your test users)

### Apple Sign-In not working on localhost

**Cause**: Apple requires HTTPS in production but allows HTTP for localhost only

**Fix**:
1. For development: Use `http://localhost:3001` exactly
2. For production: Use HTTPS domain and register it in Apple console

---

## Support

For issues:
1. Check backend logs: `cd server && npm run dev` (look for OAuth errors)
2. Verify environment variables are set correctly
3. Test OAuth status endpoint: `curl http://localhost:3001/api/auth/oauth/status`
4. Contact support if provider-specific setup is needed
