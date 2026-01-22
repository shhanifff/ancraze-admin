import * as admin from 'firebase-admin';

let adminAuth= null;
let adminDb = null;

// Only initialize if service account credentials are properly configured
if (
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_PRIVATE_KEY !== 'your_private_key_here' &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_CLIENT_EMAIL !== 'your_client_email_here'
) {
  try {
    // Parse the private key, handling both quoted and unquoted values
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    console.warn('Firebase Admin SDK not initialized. Some features will be unavailable.');
  }
} else {
  console.warn(
    '⚠️ Firebase Admin SDK credentials not configured. Please add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to .env.local'
  );
}

export { adminAuth, adminDb };
export default admin;

