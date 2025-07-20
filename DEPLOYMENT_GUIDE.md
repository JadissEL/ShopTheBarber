# ShopTheBarber - Deployment Guide

## 🚀 Firebase Authentication Integration Complete!

Your ShopTheBarber application now has Firebase Authentication integrated. Here's what's been implemented:

### ✅ What's Been Done

1. **Firebase Client Setup**
   - Installed `firebase` package
   - Created `client/lib/firebase.ts` with authentication functions
   - Created `client/hooks/useFirebaseAuth.tsx` for React integration
   - Updated `client/App.tsx` to use Firebase AuthProvider

2. **Firebase Server Setup**
   - Installed `firebase-admin` package
   - Created `server/lib/firebase-admin.js` for server-side authentication
   - Updated `server/index.js` to use Firebase token verification
   - Modified authentication middleware to work with Firebase

3. **Updated Login System**
   - Modified `client/pages/Login.tsx` to use Firebase authentication
   - Added Google Sign-In support
   - Removed mock authentication in favor of real Firebase auth

4. **Build System**
   - All builds are successful ✅
   - Production-ready code splitting and optimization
   - TypeScript compilation working correctly

## 🔧 Firebase Setup Required

Before deployment, you need to complete the Firebase setup:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "shopthebarber"
3. Enable Authentication with Email/Password and Google providers

### 2. Get Configuration
1. **Client Config**: Project Settings → Your Apps → Web App
2. **Server Config**: Project Settings → Service Accounts → Generate Private Key

### 3. Environment Variables
Create a `.env` file in your project root:

```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Server Configuration (from service account JSON)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🌐 Deployment Options

### Option 1: Netlify (Frontend) + Render (Backend) - Recommended

#### Frontend (Netlify)
1. **Push to GitHub**: `git add . && git commit -m "Firebase integration" && git push`
2. **Connect to Netlify**:
   - Build command: `npm run build:client`
   - Publish directory: `dist/client`
   - Add environment variables (all VITE_* variables)

#### Backend (Render)
1. **Create Web Service**:
   - Build command: `npm install && npm run build:server`
   - Start command: `node dist/server/node-build.mjs`
   - Add environment variables (all FIREBASE_* and server variables)

### Option 2: Vercel (Frontend) + Fly.io (Backend)

#### Frontend (Vercel)
1. Connect GitHub repository
2. Framework preset: Vite
3. Build command: `npm run build:client`
4. Output directory: `dist/client`
5. Add environment variables

#### Backend (Fly.io)
1. Install Fly CLI: `npm install -g @flyio/fly`
2. Deploy: `fly deploy`
3. Add secrets: `fly secrets set FIREBASE_PRIVATE_KEY="your-key"`

### Option 3: Traditional VPS/VM

#### Server Setup
```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone your-repo
cd lebarbier
npm install
npm run build

# Create .env file with all variables
nano .env

# Start with PM2
npm install -g pm2
pm2 start dist/server/node-build.mjs --name shopthebarber
pm2 startup
pm2 save
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/lebarbier/dist/client;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Checklist

- [ ] Firebase project created and configured
- [ ] Environment variables set in production
- [ ] CORS configured for your domain
- [ ] HTTPS enabled (automatic with Netlify/Vercel)
- [ ] Database backups configured (if using external DB)
- [ ] Rate limiting enabled (already configured)
- [ ] Security headers enabled (already configured)

## 🧪 Testing Deployment

1. **Test Authentication**:
   - Try registering a new user
   - Test login with email/password
   - Test Google sign-in
   - Verify user appears in Firebase Console

2. **Test API Endpoints**:
   - Check `/api/health` endpoint
   - Test protected routes with Firebase token
   - Verify CORS is working

3. **Test Frontend**:
   - Verify all pages load correctly
   - Test navigation and routing
   - Check that authentication state persists

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check `CORS_ORIGIN` environment variable
   - Ensure it matches your frontend domain exactly

2. **Firebase Token Verification Fails**:
   - Verify service account JSON is correct
   - Check all Firebase environment variables are set

3. **Build Failures**:
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors
   - Verify environment variables are available during build

4. **Authentication Not Working**:
   - Check Firebase Console for user creation
   - Verify Firebase project settings
   - Check browser console for errors

### Debug Commands:
```bash
# Check build locally
npm run build

# Test server locally
npm run dev:server

# Check environment variables
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"

# Test Firebase connection
node -e "const admin = require('firebase-admin'); console.log('Firebase Admin loaded')"
```

## 📈 Next Steps After Deployment

1. **Monitor Performance**:
   - Set up logging and monitoring
   - Track authentication success rates
   - Monitor API response times

2. **Enhance Security**:
   - Set up Firebase App Check
   - Implement rate limiting per user
   - Add email verification

3. **Scale Up**:
   - Consider migrating to Firestore for real-time features
   - Set up CDN for static assets
   - Implement caching strategies

## 🆘 Support

If you encounter issues:
1. Check the `FIREBASE_SETUP.md` file for detailed Firebase configuration
2. Review server logs for authentication errors
3. Verify all environment variables are correctly set
4. Test locally with `npm run dev:full` before deploying

Your application is now ready for production deployment with Firebase Authentication! 🎉 