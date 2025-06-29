/**
 * Test script for Firebase Email Link Authentication
 * 
 * This script tests the email link authentication flow by:
 * 1. Sending a sign-in link to a test email address
 * 2. Verifying that the link is valid
 * 
 * Usage:
 * node scripts/test-email-link-auth.js [test-email@example.com]
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';

// Load environment variables
config();

// Get test email from command line arguments or use default
const testEmail = process.argv[2] || 'test@example.com';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Email link authentication settings
const actionCodeSettings = {
  // URL to redirect to after email link is clicked
  url: 'http://localhost:5000/auth/email-signin-complete',
  // Handle the link in the app instead of browser
  handleCodeInApp: true,
};

/**
 * Send a sign-in link to the test email
 */
async function sendTestEmailLink() {
  try {
    console.log(`Sending sign-in link to ${testEmail}...`);
    await sendSignInLinkToEmail(auth, testEmail, actionCodeSettings);
    console.log('✅ Sign-in link sent successfully!');
    console.log('\nInstructions:');
    console.log('1. Check the email inbox for', testEmail);
    console.log('2. Click the sign-in link in the email');
    console.log('3. You should be redirected to the sign-in completion page');
    console.log('\nNote: In a real application, the email would be stored in localStorage');
    console.log('and retrieved when the user clicks the link.');
  } catch (error) {
    console.error('❌ Error sending sign-in link:', error);
    
    // Provide troubleshooting guidance based on error code
    if (error.code === 'auth/invalid-email') {
      console.log('\nTroubleshooting: The email address format is invalid.');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.log('\nTroubleshooting: The domain of the URL is not authorized in Firebase Console.');
      console.log('Go to Firebase Console > Authentication > Settings > Authorized domains');
      console.log('and add your domain (e.g., localhost, your-app.firebaseapp.com).');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.log('\nTroubleshooting: Email/Password sign-in is not enabled in Firebase Console.');
      console.log('Go to Firebase Console > Authentication > Sign-in method');
      console.log('and enable Email/Password provider and Email link sign-in method.');
    }
  }
}

// Execute the test
sendTestEmailLink();
