# Clerk Quickstart - Get Social Login Working in 5 Minutes

## Step 1: Create Clerk Account (2 minutes)

1. Go to https://clerk.com and sign up
2. Create a new application
3. Name it "ShopTheBarber"
4. **Enable Google** in Social Connections (it's already set up!)
5. **Enable Apple** in Social Connections (works out of the box!)

## Step 2: Get API Keys (1 minute)

1. In Clerk Dashboard, click "API Keys"
2. Copy your **Publishable Key** (starts with `pk_test_...`)
3. Copy your **Secret Key** (starts with `sk_test_...`)

## Step 3: Configure Environment (1 minute)

**Frontend** - Create `.env.local` in root:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Backend** - Edit `server/.env`:
```bash
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Step 4: Start the App (1 minute)

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## Step 5: Test It!

1. Open http://localhost:3000/signin
2. You'll see:
   - ✅ Google Sign-In button
   - ✅ Apple Sign-In button
   - ✅ Email/password form
3. Click "Sign in with Google" → It works immediately!

---

## What You Get

✅ **Google Login**: Ready to use, no additional setup  
✅ **Apple Login**: Ready to use, no additional setup  
✅ **Email/Password**: Built-in with email verification  
✅ **Password Reset**: Automatic recovery flows  
✅ **Session Management**: Secure tokens, auto-refresh  
✅ **User Management**: Dashboard to manage all users  

---

## Production Deployment

When deploying to production:

1. Switch to **live keys** in Clerk Dashboard (pk_live_... / sk_live_...)
2. Add your domain in Clerk: **Domains** → Add domain
3. Update environment variables on Vercel/Render with live keys
4. Done! Social login works in production automatically

---

## Need Help?

- Full docs: `docs/CLERK_SETUP.md`
- Troubleshooting: Check backend logs for detailed errors
- Clerk Support: Dashboard → Help (24/7 chat)

---

**That's it! You now have Google and Apple social login working! 🎉**
