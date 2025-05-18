import { initializeApp } from "firebase/app";
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
  signInWithEmailLink
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'workwise-sa-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'workwise-sa-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'workwise-sa-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Connect to emulators in development mode
if (import.meta.env.DEV) {
  // Check if we should use emulators (can be disabled with env var)
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'false';

  if (useEmulators) {
    console.log('Using Firebase emulators in development mode');

    // Import emulator connection functions
    import('firebase/auth').then(({ connectAuthEmulator }) => {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    });

    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
      connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
    });

    import('firebase/storage').then(({ connectStorageEmulator }) => {
      connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);
    });
  }
}

// Email link authentication settings
const actionCodeSettings = {
  // URL to redirect to after email link is clicked
  url: `${window.location.origin}/auth/email-signin-complete`,
  // Handle the link in the app instead of browser
  handleCodeInApp: true,
  // iOS and Android app configuration (if applicable)
  iOS: {
    bundleId: import.meta.env.VITE_IOS_BUNDLE_ID
  },
  android: {
    packageName: import.meta.env.VITE_ANDROID_PACKAGE_NAME,
    installApp: true,
    minimumVersion: '12'
  },
  // For Firebase Dynamic Links (optional)
  dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN,
};

// Log the current configuration for debugging
console.log('Email link authentication URL:', `${window.location.origin}/auth/email-signin-complete`);
console.log('Current origin:', window.location.origin);

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update user profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName
      });
    }
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Send email link for passwordless sign-in
export const sendSignInLink = async (email: string) => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save email locally to verify it when user clicks the link from email
    window.localStorage.setItem('emailForSignIn', email);
    return true;
  } catch (error) {
    console.error("Error sending sign-in link:", error);
    throw error;
  }
};

// Complete sign-in with email link
export const completeSignInWithEmailLink = async (email: string, link: string) => {
  try {
    const result = await signInWithEmailLink(auth, email, link);
    // Clear the stored email
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  } catch (error) {
    console.error("Error completing sign-in with email link:", error);
    throw error;
  }
};

// Check if the URL is a sign-in with email link
export const checkIfSignInWithEmailLink = (link: string): boolean => {
  return isSignInWithEmailLink(auth, link);
};

// Get email from storage (for use with email link auth)
export const getEmailFromStorage = (): string | null => {
  return window.localStorage.getItem('emailForSignIn');
};

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Helper function for file uploads
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export { auth, db, storage };