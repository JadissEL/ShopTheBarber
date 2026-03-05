# Clerk Authentication Setup Guide

This guide explains how to configure Clerk authentication for ShopTheBarber.

## What is Clerk?

Clerk is a complete authentication and user management solution that provides:
- **Social Login**: Google, Apple, Facebook, GitHub, and more
- **Email/Password**: Traditional authentication
- **Magic Links**: Passwordless email authentication
- **Multi-Factor Authentication (MFA)**
- **Session Management**: Automatic token refresh and security
- **User Management Dashboard**: Manage users, roles, and metadata
- **Email Verification**: Built-in email verification flows
- **Password Reset**: Automatic password recovery

## Why Clerk?

✅ **No Backend Auth Code**: Clerk handles all authentication logic  
✅ **Secure by Default**: Industry-standard security practices built-in  
✅ **Social Login Ready**: Google and Apple work out of the box  
✅ **Beautiful UI**: Pre-built, customizable authentication components  
✅ **Free Tier**: Up to 10,000 monthly active users for free

---

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your application name (e.g., "ShopTheBarber")
4. Select the authentication methods you want to enable

### 2. Enable Social Providers (Google & Apple)

#### Google Sign-In

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Click **Google**
3. Toggle **Enable for sign-up and sign-in**
4. Clerk provides default Google OAuth credentials for development
5. For production, you can use Clerk's default or add your own Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add Clerk's redirect URI (shown in Clerk Dashboard)
   - Copy Client ID and Secret to Clerk

#### Apple Sign-In

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Click **Apple**
3. Toggle **Enable for sign-up and sign-in**
4. For production, you need an Apple Developer account:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Create a Services ID for Sign in with Apple
   - Add Clerk's redirect URI (shown in Clerk Dashboard)
   - Generate a private key
   - Copy credentials to Clerk Dashboard

**Note**: Clerk's development environment works without additional OAuth app setup!

### 3. Get Your API Keys

1. In Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
3. Copy your **Secret Key** (starts with `sk_test_...` or `sk_live_...`)

### 4. Configure Frontend

Create `.env.local` in the root directory:

```bash
# Clerk Frontend Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 5. Configure Backend

Edit `server/.env`:

```bash
# Clerk Backend Configuration
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 6. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Navigate to `http://localhost:3000/signin` and you'll see:
- ✅ Email/password login
- ✅ Google Sign-In button (ready to use!)
- ✅ Apple Sign-In button (ready to use!)

---

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google" or "Sign in with Apple"
2. Clerk redirects to provider's OAuth page
3. User authorizes the application
4. Clerk creates/updates user account
5. Clerk issues a JWT token
6. Frontend stores token and syncs user data
7. Backend verifies Clerk JWT on API requests

### User Data

Clerk provides:
- `id`: Unique user identifier
- `emailAddress`: Primary email
- `firstName`, `lastName`: User name
- `imageUrl`: Profile picture
- `publicMetadata`: Custom data (e.g., `role`)

The frontend syncs this to our backend format:
```javascript
{
  uid: clerkUser.id,
  email: clerkUser.primaryEmailAddress?.emailAddress,
  full_name: clerkUser.fullName,
  avatar_url: clerkUser.imageUrl,
  role: clerkUser.publicMetadata?.role || 'client',
}
```

### Backend Token Verification

The backend automatically verifies Clerk JWT tokens:

```javascript
// Protected route example
fastify.get('/api/bookings', 
  { preHandler: requireClerkAuth }, // Verify Clerk token
  async (request, reply) => {
    const user = request.user; // { id, email, role }
    // ... handle request
  }
);
```

---

## Customization

### Styling Clerk Components

Clerk components are styled to match your app's design system. Customize in `src/pages/SignIn.jsx`:

```javascript
<ClerkSignIn
  appearance={{
    elements: {
      formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
      formFieldInput: "bg-card border-border text-foreground",
      // ... more custom styles
    },
  }}
/>
```

### User Roles

To add role selection during sign-up:

1. Add a custom field in Clerk Dashboard:
   - Go to **User & Authentication** → **Email, Phone, Username**
   - Add custom field: `role` (dropdown: client, barber, shop_owner)

2. Or handle it in your app:
   - After sign-up, update `publicMetadata`:
   ```javascript
   await clerkUser.update({
     publicMetadata: { role: 'barber' }
   });
   ```

### Email Templates

Customize Clerk's email templates in the Dashboard:
- **User & Authentication** → **Email, Phone, Username** → **Email**
- Edit welcome email, verification email, etc.

---

## Development vs Production

### Development
- Use `pk_test_...` and `sk_test_...` keys
- Social login works immediately (Clerk provides OAuth apps)
- No domain verification required

### Production
- Use `pk_live_...` and `sk_live_...` keys
- Add your production domain in Clerk Dashboard:
  - **Domains** → Add your domain (e.g., `shop-the-barber.vercel.app`)
- Update environment variables on Vercel/Render with production keys
- Optionally use your own Google/Apple OAuth apps for branding

---

## Troubleshooting

### "Clerk not configured" error on frontend

**Cause**: `VITE_CLERK_PUBLISHABLE_KEY` not set in `.env.local`

**Fix**:
1. Create `.env.local` in the root directory
2. Add `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`
3. Restart frontend: `npm run dev`

### Backend returns 401 Unauthorized

**Cause**: `CLERK_SECRET_KEY` not set in `server/.env`

**Fix**:
1. Edit `server/.env`
2. Add `CLERK_SECRET_KEY=sk_test_...`
3. Restart backend: `cd server && npm run dev`

### Social login buttons don't appear

**Cause**: Social providers not enabled in Clerk Dashboard

**Fix**:
1. Go to Clerk Dashboard → **Social Connections**
2. Enable Google and/or Apple
3. Toggle **Enable for sign-up and sign-in**
4. Refresh your app

### "Invalid publishable key" error

**Cause**: Wrong key format or test/live key mismatch

**Fix**:
1. Verify keys match your environment (test vs live)
2. Check for extra spaces or quotes in `.env` files
3. Ensure keys start with `pk_test_` or `sk_test_`

---

## Migration from Custom Auth

If you have existing users with custom auth:

1. **Keep both systems running** during transition
2. **Encourage re-registration** via Clerk (with social login)
3. **Sync users**: On first Clerk login, check if email exists in your DB and link accounts
4. **Gradual migration**: After 90 days, deprecate custom auth

Or contact Clerk support for bulk user import tools.

---

## Security Best Practices

✅ **Never commit `.env` files** - They contain secret keys  
✅ **Use test keys in development** - Switch to live keys only in production  
✅ **Enable MFA** - In Clerk Dashboard for admin users  
✅ **Monitor sessions** - Use Clerk Dashboard to view active sessions  
✅ **Rotate keys** - If compromised, regenerate in Clerk Dashboard  

---

## Additional Resources

- **Clerk Documentation**: [clerk.com/docs](https://clerk.com/docs)
- **React Integration**: [clerk.com/docs/quickstarts/react](https://clerk.com/docs/quickstarts/react)
- **Backend Integration**: [clerk.com/docs/backend-requests/overview](https://clerk.com/docs/backend-requests/overview)
- **Social Connections**: [clerk.com/docs/authentication/social-connections/overview](https://clerk.com/docs/authentication/social-connections/overview)

---

## Support

For issues with Clerk integration:
1. Check the [Clerk Status Page](https://status.clerk.com/)
2. Review [Clerk Community](https://clerk.com/community)
3. Contact Clerk Support in Dashboard (24/7 chat)
4. For project-specific issues, check backend logs for detailed error messages
