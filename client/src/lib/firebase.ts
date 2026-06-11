import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';
// TODO: Firebase AI is not yet available in the current Firebase SDK version
// import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const PLACEHOLDER_MARKERS = ['your_', 'placeholder', 'replace', 'changeme', 'example', 'dummy'];

const DEV_PLACEHOLDER_API_KEY = 'AIzaSyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const DEV_PLACEHOLDER_APP_ID = '1:000000000000:web:0000000000000000000000';
const DEV_PLACEHOLDER_MESSAGING_SENDER_ID = '000000000000';

const hasValue = (value?: string) => typeof value === 'string' && value.trim().length > 0;
const isPlaceholderValue = (value?: string) => {
  if (!hasValue(value)) return false;
  const normalized = value!.trim().toLowerCase();
  return PLACEHOLDER_MARKERS.some(marker => normalized.includes(marker));
};

const rawFirebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const resolvedApiKey =
  hasValue(rawFirebaseEnv.apiKey) && !isPlaceholderValue(rawFirebaseEnv.apiKey)
    ? rawFirebaseEnv.apiKey!
    : DEV_PLACEHOLDER_API_KEY;

const resolvedMessagingSenderId =
  hasValue(rawFirebaseEnv.messagingSenderId) &&
  !isPlaceholderValue(rawFirebaseEnv.messagingSenderId)
    ? rawFirebaseEnv.messagingSenderId!
    : DEV_PLACEHOLDER_MESSAGING_SENDER_ID;

const resolvedAppId =
  hasValue(rawFirebaseEnv.appId) && !isPlaceholderValue(rawFirebaseEnv.appId)
    ? rawFirebaseEnv.appId!
    : DEV_PLACEHOLDER_APP_ID;

console.log('Starting Firebase initialization...');

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: rawFirebaseEnv.authDomain || 'workwise-sa-project.firebaseapp.com',
  projectId: rawFirebaseEnv.projectId || 'workwise-sa-project',
  storageBucket: rawFirebaseEnv.storageBucket || 'workwise-sa-project.appspot.com',
  messagingSenderId: resolvedMessagingSenderId,
  appId: resolvedAppId,
};

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

const missingConfig = Object.entries(rawFirebaseEnv)
  .filter(([key, value]) => !hasValue(value) && key !== 'messagingSenderId')
  .map(([key]) => key);

const placeholderConfig = Object.entries(rawFirebaseEnv)
  .filter(([_, value]) => isPlaceholderValue(value))
  .map(([key]) => key);

const usingDevFallbackConfig = Object.entries(rawFirebaseEnv)
  .filter(
    ([key, value]) =>
      (key === 'apiKey' || key === 'appId' || key === 'messagingSenderId') &&
      (!hasValue(value) || isPlaceholderValue(value))
  )
  .map(([key]) => key);

const configWarnings = [...new Set([...missingConfig, ...placeholderConfig])];
const allowPlaceholderFirebaseForDev = useEmulators;
const firebaseClientOpsEnabled = configWarnings.length === 0 || allowPlaceholderFirebaseForDev;

export const firebaseStatus = {
  initialized: false,
  clientOpsEnabled: firebaseClientOpsEnabled,
  useEmulators,
  missingConfig,
  placeholderConfig,
  usingDevFallbackConfig,
  mode: firebaseClientOpsEnabled
    ? configWarnings.length > 0
      ? 'emulator-placeholder'
      : 'configured'
    : 'disabled',
  initError: null as unknown,
};

if (missingConfig.length > 0) {
  console.warn('Firebase config missing values:', missingConfig.join(', '));
}

if (placeholderConfig.length > 0) {
  console.warn('Firebase config contains placeholder values:', placeholderConfig.join(', '));
}

if (usingDevFallbackConfig.length > 0) {
  console.warn('Using local Firebase placeholder defaults for:', usingDevFallbackConfig.join(', '));
}

if (!firebaseClientOpsEnabled) {
  console.warn(
    'Firebase client auth/uploads are running in disabled mode until real Firebase keys are provided (or emulators are enabled).'
  );
}

console.log('Firebase config:', { ...firebaseConfig, apiKey: '[REDACTED]' });

let app: ReturnType<typeof initializeApp>;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  firebaseStatus.initialized = true;
  console.log('Firebase initialized successfully');
} catch (error) {
  firebaseStatus.initError = error;
  console.error('Firebase initialization failed:', error);
  throw error;
}

if (import.meta.env.DEV) {
  console.log('Development mode detected, useEmulators:', useEmulators);

  if (useEmulators) {
    console.log('Connecting to Firebase emulators...');

    import('firebase/auth')
      .then(({ connectAuthEmulator }) => {
        console.log('Connecting to Auth emulator on http://127.0.0.1:9099');
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      })
      .catch(error => {
        console.warn('Failed to connect to Auth emulator:', error);
      });

    import('firebase/firestore')
      .then(({ connectFirestoreEmulator }) => {
        console.log('Connecting to Firestore emulator on 127.0.0.1:8080');
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
      })
      .catch(error => {
        console.warn('Failed to connect to Firestore emulator:', error);
      });

    import('firebase/storage')
      .then(({ connectStorageEmulator }) => {
        console.log('Connecting to Storage emulator on 127.0.0.1:9199');
        connectStorageEmulator(storage, '127.0.0.1', 9199);
      })
      .catch(error => {
        console.warn('Failed to connect to Storage emulator:', error);
      });
  } else {
    console.log('Using production Firebase services (emulators disabled)');
  }
}

const fallbackOrigin =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

const actionCodeSettings: ActionCodeSettings = {
  url:
    import.meta.env.VITE_AUTH_EMAIL_LINK_SIGN_IN_URL ||
    `${fallbackOrigin}/auth/email-signin-complete`,
  handleCodeInApp: true,
  ...(import.meta.env.VITE_IOS_BUNDLE_ID
    ? {
        iOS: {
          bundleId: import.meta.env.VITE_IOS_BUNDLE_ID,
        },
      }
    : {}),
  ...(import.meta.env.VITE_ANDROID_PACKAGE_NAME
    ? {
        android: {
          packageName: import.meta.env.VITE_ANDROID_PACKAGE_NAME,
          installApp: true,
          minimumVersion: '12',
        },
      }
    : {}),
  ...(import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN
    ? {
        dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN,
      }
    : {}),
};

console.log(
  'Email link authentication URL:',
  import.meta.env.VITE_AUTH_EMAIL_LINK_SIGN_IN_URL || `${fallbackOrigin}/auth/email-signin-complete`
);
console.log('Current origin:', fallbackOrigin);

const buildFirebaseUnavailableError = (operation: string) => {
  const error = new Error(
    useEmulators
      ? `Firebase ${operation} is unavailable. Start the Firebase emulators or add real Firebase keys.`
      : `Firebase ${operation} is disabled until Firebase client keys are configured in client/.env.`
  ) as Error & { code: string; details?: unknown };
  error.code = 'firebase/unavailable-config';
  error.details = {
    operation,
    missingConfig: firebaseStatus.missingConfig,
    placeholderConfig: firebaseStatus.placeholderConfig,
    useEmulators: firebaseStatus.useEmulators,
  };
  return error;
};

const ensureFirebaseClientOpsEnabled = (operation: string) => {
  if (!firebaseStatus.clientOpsEnabled) {
    throw buildFirebaseUnavailableError(operation);
  }
};

const ensureGoogleProvider = () => {
  if (!googleProvider) {
    throw buildFirebaseUnavailableError('Google sign-in');
  }
  return googleProvider;
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    ensureFirebaseClientOpsEnabled('sign up');

    console.log(`Attempting to sign up user with email: ${email}`);
    console.log('Firebase auth initialized:', !!auth);
    console.log('Using Firebase emulators:', useEmulators ? 'Yes' : 'No');

    if (useEmulators) {
      console.log('Using Firebase Auth emulator at http://127.0.0.1:9099');

      try {
        const response = await fetch('http://127.0.0.1:9099', { method: 'GET' });
        if (!response.ok) {
          console.warn('Firebase Auth emulator might not be running. Registration might fail.');
        }
      } catch {
        console.error('Cannot connect to Firebase Auth emulator. Registration will likely fail.');
        console.error('Please start Firebase emulators or set VITE_USE_FIREBASE_EMULATORS=false');
      }
    }

    console.log('Creating user with Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully:', userCredential.user.uid);

    if (userCredential.user) {
      console.log('Updating user profile with display name:', displayName);
      await updateProfile(userCredential.user, { displayName });
      console.log('User profile updated successfully');
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing up:', error.code, error.message);
    console.error('Full error details:', error);

    if (error.code === 'auth/network-request-failed') {
      console.error('Network request failed. This could indicate that:');
      console.error("1. You're not connected to the internet");
      console.error('2. Firebase emulators are not running (if using emulators)');
      console.error('3. Firebase project is not properly configured');

      if (useEmulators) {
        console.error(
          "IMPORTANT: You're configured to use Firebase emulators, but they might not be running."
        );
        console.error(
          "Either start the emulators with 'firebase emulators:start' or set VITE_USE_FIREBASE_EMULATORS=false"
        );
      }
    }

    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    ensureFirebaseClientOpsEnabled('sign in');
    console.log(`Attempting to sign in user with email: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error.code, error.message);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    ensureFirebaseClientOpsEnabled('Google sign in');
    const result = await signInWithPopup(auth, ensureGoogleProvider());
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    if (!firebaseStatus.clientOpsEnabled) {
      return;
    }
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!firebaseStatus.clientOpsEnabled) {
    return null;
  }
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!firebaseStatus.clientOpsEnabled) {
    Promise.resolve().then(() => callback(null));
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Send email link for passwordless sign-in
export const sendSignInLink = async (email: string) => {
  try {
    ensureFirebaseClientOpsEnabled('email link sign in');
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    return true;
  } catch (error) {
    console.error('Error sending sign-in link:', error);
    throw error;
  }
};

// Complete sign-in with email link
export const completeSignInWithEmailLink = async (email: string, link: string) => {
  try {
    ensureFirebaseClientOpsEnabled('email link completion');
    const result = await signInWithEmailLink(auth, email, link);
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  } catch (error) {
    console.error('Error completing sign-in with email link:', error);
    throw error;
  }
};

// Check if the URL is a sign-in with email link
export const checkIfSignInWithEmailLink = (link: string): boolean => {
  if (!firebaseStatus.clientOpsEnabled) {
    return false;
  }
  return isSignInWithEmailLink(auth, link);
};

// Get email from storage (for use with email link auth)
export const getEmailFromStorage = (): string | null => {
  return window.localStorage.getItem('emailForSignIn');
};

// Helper function for file uploads
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    ensureFirebaseClientOpsEnabled('file upload');
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// AI Helper Functions
export const generateContent = async (prompt: string): Promise<string> => {
  console.warn('Firebase AI not yet available. This is a placeholder response.');
  return `AI Response to: "${prompt}"\n\nThis is a placeholder response. Firebase AI integration will be available when the firebase/ai package is released.`;
};

export { app, auth, db, storage };
