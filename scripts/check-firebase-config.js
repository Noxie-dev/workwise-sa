// scripts/check-firebase-config.js
// A simple script to check Firebase configuration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../client/.env') });

// Required Firebase configuration variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID'
];

// Optional Firebase configuration variables
const optionalVars = [
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_USE_FIREBASE_EMULATORS',
  'VITE_AUTH_EMAIL_LINK_SIGN_IN_URL',
  'VITE_AUTH_EMAIL_LINK_CONTINUE_URL'
];

console.log('Checking Firebase configuration...');

// Check required variables
const missingRequired = requiredVars.filter(varName => !process.env[varName]);
if (missingRequired.length > 0) {
  console.error('❌ Missing required Firebase configuration variables:');
  missingRequired.forEach(varName => {
    console.error(`   - ${varName}`);
  });
} else {
  console.log('✅ All required Firebase configuration variables are set');
}

// Check optional variables
const missingOptional = optionalVars.filter(varName => !process.env[varName]);
if (missingOptional.length > 0) {
  console.warn('⚠️ Some optional Firebase configuration variables are not set:');
  missingOptional.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
} else {
  console.log('✅ All optional Firebase configuration variables are set');
}

// Check Firebase API key format
const apiKey = process.env.VITE_FIREBASE_API_KEY;
if (apiKey && apiKey.length < 30) {
  console.warn('⚠️ Firebase API key appears to be truncated or invalid');
  console.warn('   API keys are typically 39 characters long');
  console.warn(`   Current length: ${apiKey.length} characters`);
}

// Check emulator configuration
if (process.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log('ℹ️ Firebase emulators are enabled in configuration');
  console.log('   Make sure emulators are running with: firebase emulators:start');
} else {
  console.log('ℹ️ Firebase emulators are disabled or not configured');
}

// Exit with error code if required variables are missing
if (missingRequired.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}