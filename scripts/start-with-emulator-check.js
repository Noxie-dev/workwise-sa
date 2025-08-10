// scripts/start-with-emulator-check.js
// A script to check if Firebase emulators are running before starting the app

import http from 'http';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../client/.env') });

// Check if emulators are enabled in config
const useEmulators = process.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (!useEmulators) {
  console.log('Firebase emulators are disabled in configuration. Starting app normally...');
  startApp();
} else {
  console.log('Firebase emulators are enabled in configuration. Checking if they are running...');
  checkEmulators();
}

// Check if emulators are running
function checkEmulators() {
  const authEmulatorPort = 9099;
  const firestoreEmulatorPort = 8080;
  const storageEmulatorPort = 9199;
  
  Promise.all([
    checkPort(authEmulatorPort, 'Auth'),
    checkPort(firestoreEmulatorPort, 'Firestore'),
    checkPort(storageEmulatorPort, 'Storage')
  ]).then(results => {
    const allRunning = results.every(result => result);
    
    if (allRunning) {
      console.log('✅ All Firebase emulators are running!');
      startApp();
    } else {
      console.log('❌ Some Firebase emulators are not running!');
      askToStartEmulators();
    }
  });
}

// Check if a service is running on a specific port
function checkPort(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name} emulator is running on port ${port}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.error(`❌ ${name} emulator is NOT running on port ${port}`);
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      console.error(`❌ ${name} emulator timed out on port ${port}`);
      resolve(false);
    });
  });
}

// Ask user if they want to start emulators
function askToStartEmulators() {
  console.log('\nWould you like to start the Firebase emulators? (y/n)');
  
  process.stdin.once('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    
    if (input === 'y' || input === 'yes') {
      startEmulators();
    } else {
      console.log('\nYou can:');
      console.log('1. Start emulators manually with: firebase emulators:start');
      console.log('2. Disable emulators by setting VITE_USE_FIREBASE_EMULATORS=false in your .env file');
      console.log('\nExiting...');
      process.exit(1);
    }
  });
}

// Start Firebase emulators
function startEmulators() {
  console.log('\nStarting Firebase emulators...');
  
  const emulators = spawn('firebase', ['emulators:start'], {
    stdio: 'inherit',
    shell: true
  });
  
  emulators.on('error', (err) => {
    console.error('Failed to start Firebase emulators:', err);
    console.log('Make sure you have the Firebase CLI installed.');
    console.log('You can install it with: npm install -g firebase-tools');
    process.exit(1);
  });
  
  // We don't start the app here because the emulators will keep running in this process
}

// Start the application
function startApp() {
  console.log('\nStarting the application...');
  
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const app = spawn(npm, ['run', 'dev:original'], {
    stdio: 'inherit',
    shell: true
  });
  
  app.on('error', (err) => {
    console.error('Failed to start the application:', err);
    process.exit(1);
  });
}