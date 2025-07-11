import * as admin from 'firebase-admin';
// Simple logger function
const log = (message: string, source = 'firebase') => {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};
import { secretManager } from './services/secretManager';

/**
 * Initializes the Firebase Admin SDK with appropriate credentials
 * based on the current environment.
 */
async function initializeFirebase() {
  try {
    // Check if app is already initialized
    if (admin.apps && admin.apps.length > 0) {
      return admin.apps[0];
    }

    // For development without emulators
    if (process.env.NODE_ENV !== 'production') {
      try {
        const serviceAccount = require('../service-account.json');
        // Check if it's a placeholder file
        if (serviceAccount.private_key_id === 'placeholder') {
          log('Using placeholder Firebase Admin SDK - some features may not work');
          // Return a mock app for development
          return null;
        }
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: await secretManager.getSecret('FIREBASE_PROJECT_ID') || 'workwise-sa-project',
          storageBucket: await secretManager.getSecret('FIREBASE_STORAGE_BUCKET') || 'workwise-sa-project.appspot.com'
        });
      } catch (error) {
        log('Service account file not found or invalid, using development mode without Firebase Admin');
        return null;
      }
    }

    // For production
    return admin.initializeApp();
  } catch (error) {
    log(`Error initializing Firebase: ${error}`);
    throw new Error(`Failed to initialize Firebase: ${error}`);
  }
}

// Create mock services that won't crash the app
const mockDb = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => ({}) }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({})
    }),
    get: async () => ({ docs: [], empty: true }),
    add: async () => ({ id: 'mock-id' })
  })
};

const mockStorage = {
  bucket: () => ({
    file: () => ({
      getSignedUrl: async () => ['mock-url'],
      delete: async () => ({})
    })
  })
};

// Initialize Firebase and export the instances
let firebaseApp: admin.app.App | null = null;
let db: any = mockDb;
let storage: any = mockStorage;

// Async function to initialize Firebase services
async function initializeFirebaseServices() {
  try {
    firebaseApp = await initializeFirebase();
    
    if (firebaseApp) {
      db = admin.firestore(firebaseApp);
      storage = admin.storage(firebaseApp);
      log('✅ Firebase Admin SDK initialized successfully');
    } else {
      log('⚠️  Firebase Admin SDK not available - using mock services for development');
    }
  } catch (error) {
    log(`❌ Error initializing Firebase services: ${error}`);
    // Keep using mock services
  }
}

// Export services
export { db, storage };
export { initializeFirebaseServices };
export default firebaseApp;

