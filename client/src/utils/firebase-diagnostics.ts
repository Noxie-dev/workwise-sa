// Firebase Diagnostics Tool
// This utility helps diagnose common Firebase configuration issues

import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, listAll } from "firebase/storage";

export async function runFirebaseDiagnostics() {
  console.group('🔍 Firebase Configuration Diagnostics');
  
  // Check environment variables
  console.log('Checking Firebase environment variables...');
  const envVars = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars.join(', '));
  } else {
    console.log('✅ All Firebase environment variables are defined');
  }
  
  // Check Firebase Auth
  console.log('Testing Firebase Authentication...');
  try {
    const auth = getAuth();
    // Try anonymous sign-in as a simple test
    await signInAnonymously(auth);
    console.log('✅ Firebase Authentication is working');
    
    // Sign out after test
    await auth.signOut();
  } catch (error: any) {
    console.error('❌ Firebase Authentication test failed:', error.message);
    console.error('Error code:', error.code);
  }
  
  // Check Firebase Emulator status
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    console.log('Firebase Emulators are enabled in configuration');
    
    // Simple check for emulator connectivity
    try {
      const response = await fetch('http://localhost:9099', { method: 'GET' });
      if (response.ok) {
        console.log('✅ Firebase Auth Emulator appears to be running');
      } else {
        console.warn('⚠️ Firebase Auth Emulator might not be running correctly');
      }
    } catch (error) {
      console.error('❌ Cannot connect to Firebase Auth Emulator. Make sure it is running.');
    }
  } else {
    console.log('Firebase Emulators are disabled in configuration');
  }
  
  console.groupEnd();
  
  return {
    configComplete: missingVars.length === 0,
    missingVars,
  };
}

// Export a function to run a quick check that can be called on app startup
export function quickFirebaseCheck() {
  const envVars = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };
  
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error('❌ Firebase configuration issue: Missing required variables:', missingVars.join(', '));
    return false;
  }
  
  return true;
}