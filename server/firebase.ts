import * as admin from 'firebase-admin';
import { logger } from './utils/logger';
import { secretManager } from './services/secretManager';
import * as fs from 'fs';
import * as path from 'path';

class FirebaseUnavailableError extends Error {
  code = 'firebase/unavailable';
}

/**
 * Initializes the Firebase Admin SDK with appropriate credentials
 * based on the current environment.
 */
async function initializeFirebase() {
  if (admin.apps && admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = await secretManager.getSecret('FIREBASE_PROJECT_ID');
  const storageBucket = await secretManager.getSecret('FIREBASE_STORAGE_BUCKET');
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (serviceAccount.private_key_id === 'placeholder') {
      throw new FirebaseUnavailableError('Firebase service account file is still a placeholder');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
      storageBucket: storageBucket || `${serviceAccount.project_id}.appspot.com`,
    });
  }

  if (!projectId || !storageBucket) {
    throw new FirebaseUnavailableError('Firebase Admin SDK is not configured for this environment');
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
    storageBucket,
  });
}

let firebaseApp: admin.app.App | null = null;
let authInstance: admin.auth.Auth | null = null;
let firestoreInstance: admin.firestore.Firestore | null = null;
let storageInstance: admin.storage.Storage | null = null;
let initializationError: Error | null = null;

function assertFirebaseReady<T>(service: T | null, serviceName: string): T {
  if (service) {
    return service;
  }

  const reason = initializationError?.message || 'Firebase Admin SDK has not been initialized';
  throw new FirebaseUnavailableError(`${serviceName} unavailable: ${reason}`);
}

export const auth = {
  verifyIdToken: async (token: string) => assertFirebaseReady(authInstance, 'Firebase Auth').verifyIdToken(token),
  getUser: async (uid: string) => assertFirebaseReady(authInstance, 'Firebase Auth').getUser(uid),
  getUserByEmail: async (email: string) => assertFirebaseReady(authInstance, 'Firebase Auth').getUserByEmail(email),
};

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop, receiver) {
    const instance = assertFirebaseReady(firestoreInstance, 'Firestore');
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const storage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop, receiver) {
    const instance = assertFirebaseReady(storageInstance, 'Cloud Storage');
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Checks if the Firebase services are properly initialized
 * @returns True if real Firebase services are being used, false if using mocks
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && authInstance !== null && firestoreInstance !== null && storageInstance !== null;
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
      const app = firebaseApp ?? undefined;
      authInstance = admin.auth(app);
      firestoreInstance = admin.firestore(app);
      storageInstance = admin.storage(app);
      initializationError = null;
      logger.info('Firebase Admin SDK initialized successfully');
      return;
    } catch (error) {
      lastError = error as Error;
      initializationError = lastError;
      retries++;
      
      if (retries < maxRetries) {
        logger.warn(`Firebase initialization failed, retrying (${retries}/${maxRetries})`, { error });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries failed, use mock services as fallback
  logger.error('All Firebase initialization attempts failed', {
    error: lastError,
    retries,
    maxRetries
  });
}

export { initializeFirebaseServices };
export { firebaseApp as default };
