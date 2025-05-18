import * as admin from 'firebase-admin';
import { log } from './vite';

/**
 * Initializes the Firebase Admin SDK with appropriate credentials
 * based on the current environment.
 */
function initializeFirebase() {
  try {
    // Check if app is already initialized
    if (admin.apps && admin.apps.length > 0) {
      return admin.apps[0];
    }

    // For development without emulators
    if (process.env.NODE_ENV !== 'production') {
      const serviceAccount = require('../service-account.json');
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'workwisesa-dev-us',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'workwisesa-dev-us.appspot.com'
      });
    }

    // For production
    return admin.initializeApp();
  } catch (error) {
    log(`Error initializing Firebase: ${error}`);
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

