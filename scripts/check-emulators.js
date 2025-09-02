// scripts/check-emulators.js
// A simple script to check if Firebase emulators are running

import http from 'http';

// Check if a service is running on a specific port
function checkService(port, name) {
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

async function checkEmulators() {
  console.log('Checking Firebase emulators...');
  
  const authRunning = await checkService(9099, 'Auth');
  const firestoreRunning = await checkService(8080, 'Firestore');
  const storageRunning = await checkService(9199, 'Storage');
  
  if (authRunning && firestoreRunning && storageRunning) {
    console.log('\n✅ All Firebase emulators are running!');
    return true;
  } else {
    console.log('\n❌ Some Firebase emulators are not running!');
    console.log('\nTo start the emulators, run:');
    console.log('firebase emulators:start');
    return false;
  }
}

// Run the check
checkEmulators().then((allRunning) => {
  if (!allRunning) {
    console.log('\nIf you want to use real Firebase services instead of emulators:');
    console.log('1. Set VITE_USE_FIREBASE_EMULATORS=false in your .env file');
    console.log('2. Restart your development server');
    process.exit(1);
  } else {
    process.exit(0);
  }
});