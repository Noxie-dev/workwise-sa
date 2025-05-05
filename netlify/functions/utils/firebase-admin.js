import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initializeFirebase() {
  // Check if app is already initialized
  if (admin.apps && admin.apps.length > 0) {
    return admin.apps[0];
  }

  // For Netlify Functions, we'll use environment variables
  try {
    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'workwisesa-dev-us',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'workwisesa-dev-us.appspot.com'
    });
  } catch (error) {
    console.error(`Error initializing Firebase: ${error}`);
    throw new Error(`Failed to initialize Firebase: ${error}`);
  }
}

// Initialize Firebase and export the instances
const firebaseApp = initializeFirebase();
if (!firebaseApp) {
  throw new Error('Failed to initialize Firebase Admin SDK');
}

export const db = admin.firestore(firebaseApp);
export const storage = admin.storage(firebaseApp);
export default firebaseApp;
