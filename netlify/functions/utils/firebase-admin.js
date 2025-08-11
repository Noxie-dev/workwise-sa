import * as admin from 'firebase-admin';

// Mock Firestore for when Firebase credentials are not available
class MockFirestore {
  collection() {
    return {
      doc: () => ({
        get: async () => ({
          exists: true,
          data: () => ({ status: 'Mock data - Firebase credentials not configured' }),
          id: 'mock-id'
        }),
        set: async () => true,
        update: async () => true,
        delete: async () => true
      }),
      get: async () => ({
        docs: [
          {
            id: 'mock-id',
            data: () => ({ status: 'Mock data - Firebase credentials not configured' }),
            exists: true
          }
        ],
        empty: false
      }),
      add: async () => ({ id: 'new-mock-id' }),
      where: () => this.collection()
    };
  }
}

// Mock Storage for when Firebase credentials are not available
class MockStorage {
  bucket() {
    return {
      file: () => ({
        getSignedUrl: async () => ['https://example.com/mock-signed-url'],
        save: async () => true,
        delete: async () => true
      }),
      upload: async () => [{ name: 'mock-file' }]
    };
  }
}

// Initialize Firebase Admin SDK
function initializeFirebase() {
  // Check if app is already initialized
  if (admin.apps && admin.apps.length > 0) {
    return admin.apps[0];
  }

  // For Netlify Functions, we'll use environment variables
  try {
    // Check if Firebase service account is available
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.warn('Firebase service account not found in environment variables. Using mock implementation.');
      return null;
    }

    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'workwise-sa-project',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'workwise-sa-project.firebasestorage.app'
    });
  } catch (error) {
    console.error(`Error initializing Firebase: ${error}`);
    console.warn('Using mock implementation instead.');
    return null;
  }
}

// Initialize Firebase or use mocks
const firebaseApp = initializeFirebase();

// Export real or mock instances
export const db = firebaseApp ? admin.firestore(firebaseApp) : new MockFirestore();
export const storage = firebaseApp ? admin.storage(firebaseApp) : new MockStorage();
export default firebaseApp;
