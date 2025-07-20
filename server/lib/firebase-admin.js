import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, you should use environment variables for the service account
const serviceAccount = {
  type: process.env.FIREBASE_TYPE || "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "shopthebarber-79fd9",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "demo-key-id",
  private_key: process.env.FIREBASE_PRIVATE_KEY ? 
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nVQoR64FavJ61LjkyfwVl9cKx4Qr0Kh8q5kydSKoR4FiofL6evEsXCSVHPyW/TaG\nm2FQZzxW3BEY6jB2xjdf9y8r9E2lsV+jPZHzJGsHtJt5NYL3rW9aLcBwqhAHj8D\n-----END PRIVATE KEY-----\n",
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "demo@shopthebarber-79fd9.iam.gserviceaccount.com",
  client_id: process.env.FIREBASE_CLIENT_ID || "demo-client-id",
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/demo%40shopthebarber-79fd9.iam.gserviceaccount.com"
};

// Initialize the app if it hasn't been initialized already
let firebaseApp;
try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://shopthebarber-79fd9.firebaseio.com"
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    firebaseApp = admin.app();
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error.message);
  console.warn('Continuing without Firebase Admin SDK...');
}

// Export the auth instance (or null if initialization failed)
export const auth = firebaseApp ? firebaseApp.auth() : null;

// Middleware to verify Firebase ID token
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    // If Firebase is not configured, skip token verification for development
    if (!auth) {
      console.warn('Firebase Admin not configured, skipping token verification');
      req.user = {
        uid: 'demo-user',
        email: 'demo@example.com',
        emailVerified: true,
        name: 'Demo User',
        picture: null,
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      // You can add more fields as needed
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Function to get user by UID
export const getUserByUid = async (uid) => {
  try {
    if (!auth) {
      console.warn('Firebase Admin not configured, returning demo user');
      return {
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User',
        photoURL: null,
      };
    }
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw error;
  }
};

// Function to create custom token
export const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!auth) {
      console.warn('Firebase Admin not configured, cannot create custom token');
      return 'demo-token';
    }
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
};

export default admin; 