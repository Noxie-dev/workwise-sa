import * as admin from 'firebase-admin';
import { logger } from './utils/logger';
import { secretManager } from './services/secretManager';
import * as fs from 'fs';
import * as path from 'path';

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

    // Get Firebase configuration from environment variables
    const projectId = await secretManager.getSecret('FIREBASE_PROJECT_ID');
    const storageBucket = await secretManager.getSecret('FIREBASE_STORAGE_BUCKET');
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../service-account.json');

    // For development without emulators
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Check if service account file exists
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = require(serviceAccountPath);
          
          // Check if it's a placeholder file
          if (serviceAccount.private_key_id === 'placeholder') {
            logger.warn('Using placeholder Firebase Admin SDK - some features may not work');
            // Return a mock app for development
            return null;
          }
          
          // Initialize with service account
          return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId || serviceAccount.project_id,
            storageBucket: storageBucket || `${serviceAccount.project_id}.appspot.com`
          });
        } else {
          // Try application default credentials as fallback
          logger.warn('Service account file not found, attempting to use application default credentials');
          return admin.initializeApp({
            projectId,
            storageBucket
          });
        }
      } catch (error) {
        logger.warn('Service account file not found or invalid, using development mode without Firebase Admin', { error });
        return null;
      }
    }

    // For production - use application default credentials
    return admin.initializeApp({
      projectId,
      storageBucket
    });
  } catch (error) {
    logger.error('Error initializing Firebase', { error });
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
    add: async () => ({ id: 'mock-id' }),
    where: () => ({
      get: async () => ({ docs: [], empty: true }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ docs: [], empty: true })
        })
      })
    }),
    orderBy: () => ({
      limit: () => ({
        get: async () => ({ docs: [], empty: true })
      })
    })
  })
};

const mockStorage = {
  bucket: () => ({
    file: () => ({
      getSignedUrl: async () => ['mock-url'],
      delete: async () => ({}),
      save: async () => ({}),
      download: async () => ([Buffer.from('')]),
      exists: async () => ([false])
    }),
    upload: async () => ([{ name: 'mock-file' }]),
    getFiles: async () => ([[]]),
    exists: async () => ([false])
  })
};

// Initialize Firebase and export the instances
let firebaseApp: admin.app.App | null = null;
let db: any = mockDb;
let storage: any = mockStorage;
let isUsingMockServices = false;

/**
 * Checks if the Firebase services are properly initialized
 * @returns True if real Firebase services are being used, false if using mocks
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && !isUsingMockServices;
}

/**
 * Async function to initialize Firebase services with retries
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
async function initializeFirebaseServices(maxRetries = 3, retryDelay = 2000): Promise<void> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      firebaseApp = await initializeFirebase();
      
      if (firebaseApp) {
        db = admin.firestore(firebaseApp);
        storage = admin.storage(firebaseApp);
        isUsingMockServices = false;
        logger.info('Firebase Admin SDK initialized successfully');
        return;
      } else {
        logger.warn('Firebase Admin SDK not available - using mock services for development');
        isUsingMockServices = true;
        return;
      }
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      if (retries < maxRetries) {
        logger.warn(`Firebase initialization failed, retrying (${retries}/${maxRetries})`, { error });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries failed, use mock services as fallback
  logger.error('All Firebase initialization attempts failed, using mock services', { 
    error: lastError,
    retries,
    maxRetries
  });
  isUsingMockServices = true;
}

// Export services
export { db, storage, initializeFirebaseServices };
export default firebaseApp;

