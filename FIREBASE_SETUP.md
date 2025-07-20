# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your ShopTheBarber application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "shopthebarber")
4. Follow the setup wizard (you can disable Google Analytics for now)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Enable and configure
   - **Google**: Enable and configure (optional but recommended)

## 3. Get Firebase Configuration

### Client Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "ShopTheBarber Web")
5. Copy the configuration object

### Server Configuration (Admin SDK)
1. In Firebase Console, go to Project Settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file (keep this secure!)

## 4. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration (Client)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Configuration (Server - Admin SDK)
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
```

## 5. Update Firebase Configuration

### Client Side
Update `client/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### Server Side
Update `server/lib/firebase-admin.js` with your service account details from the downloaded JSON file.

## 6. Database Integration

The current setup uses Firebase Authentication but still stores user data in SQLite. You can:

1. **Keep SQLite**: Store additional user data (role, preferences, etc.) in SQLite
2. **Migrate to Firestore**: Move all data to Firebase Firestore for a fully Firebase solution

## 7. Testing the Setup

1. Start your development server: `npm run dev:full`
2. Try to register a new user
3. Try to log in with the registered user
4. Check Firebase Console to see if users are being created

## 8. Security Rules (if using Firestore)

If you decide to use Firestore, set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public data (barbers, services)
    match /barbers/{barberId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'barber';
    }
    
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

## 9. Deployment Considerations

### Frontend (Netlify/Vercel)
- Add environment variables in your hosting platform
- Make sure CORS is configured correctly

### Backend (Render/Fly.io/Heroku)
- Add Firebase environment variables
- Ensure the service account has proper permissions

## 10. Troubleshooting

### Common Issues:
1. **CORS errors**: Make sure your Firebase project allows your domain
2. **Token verification fails**: Check that your service account JSON is correct
3. **Environment variables not loading**: Restart your development server after adding .env

### Debug Tips:
- Check browser console for Firebase errors
- Check server logs for authentication errors
- Verify Firebase project settings match your configuration

## 11. Next Steps

After Firebase is working:
1. Implement password reset functionality
2. Add email verification
3. Set up user profile management
4. Add role-based access control
5. Implement real-time features with Firestore

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Verify all environment variables are set correctly
3. Ensure your Firebase project is properly configured
4. Check that all dependencies are installed (`firebase` and `firebase-admin`) 