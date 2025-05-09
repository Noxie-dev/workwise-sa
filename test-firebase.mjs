// Simple script to test Firebase connection
import * as admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK using the service account file path
const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'workwise-sa-project',
  storageBucket: 'workwise-sa-project.appspot.com'
});

// Test Firestore connection
const db = admin.firestore(app);

async function testFirestore() {
  try {
    // Try to get a document from Firestore
    const testDoc = await db.collection('test').doc('test').get();
    console.log('Firestore connection successful!');
    console.log('Document exists:', testDoc.exists);

    // Create a test document if it doesn't exist
    if (!testDoc.exists) {
      await db.collection('test').doc('test').set({
        message: 'Test document created successfully',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Test document created successfully');
    } else {
      console.log('Test document data:', testDoc.data());
    }
  } catch (error) {
    console.error('Error testing Firestore connection:', error);
  }
}

// Test Storage connection
const storage = admin.storage(app);

async function testStorage() {
  try {
    // Try to list files in the default bucket
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log('Storage connection successful!');
    console.log('Files in bucket:', files.length);
    files.forEach(file => {
      console.log('- File:', file.name);
    });
  } catch (error) {
    console.error('Error testing Storage connection:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('Testing Firebase connections...');
  await testFirestore();
  await testStorage();
  console.log('Tests completed.');
  process.exit(0);
}

runTests();
