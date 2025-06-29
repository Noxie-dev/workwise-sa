import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { DatabaseStorage } from '../server/storage';

// Load environment variables
config();

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'workwisesa-dev-firebase-adminsdk-fbsvc-f426ddcf9a.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'workwisesa-dev-us',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'workwisesa-dev-us.appspot.com'
});

// Initialize storage
const storage = new DatabaseStorage();

// Test user data
const testUser = {
  email: 'test-persistence@example.com',
  password: 'Test123!',
  displayName: 'Test Persistence',
  userData: {
    username: 'test-persistence',
    email: 'test-persistence@example.com',
    name: 'Test Persistence',
    location: 'Cape Town',
    bio: 'Test user for persistence testing',
    phoneNumber: '0123456789',
    willingToRelocate: true,
    notificationPreference: true
  }
};

async function testAuthPersistence() {
  try {
    console.log('Testing authentication and data persistence...');
    
    // Step 1: Create user in Firebase Auth
    let firebaseUser;
    try {
      // Check if user already exists
      firebaseUser = await admin.auth().getUserByEmail(testUser.email).catch(() => null);
      
      if (firebaseUser) {
        console.log(`User ${testUser.email} already exists in Firebase Auth`);
      } else {
        // Create user in Firebase Auth
        firebaseUser = await admin.auth().createUser({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName,
          emailVerified: true
        });
        
        console.log(`Created Firebase Auth user: ${firebaseUser.uid}`);
      }
    } catch (error) {
      console.error('Error with Firebase Auth:', error);
      return;
    }
    
    // Step 2: Create user in database
    try {
      // Check if user exists in database
      const existingDbUser = await storage.getUserByUsername(testUser.userData.username);
      
      if (existingDbUser) {
        console.log(`User ${testUser.userData.username} already exists in database`);
        console.log('Database user data:', existingDbUser);
      } else {
        // Create user in database
        const dbUser = await storage.createUser(testUser.userData);
        console.log(`Created database user: ${dbUser.id}`);
        console.log('Database user data:', dbUser);
      }
    } catch (error) {
      console.error('Error with database storage:', error);
    }
    
    // Step 3: Verify user exists in Firebase Auth
    try {
      const verifiedFirebaseUser = await admin.auth().getUserByEmail(testUser.email);
      console.log('Verified Firebase Auth user exists:', verifiedFirebaseUser.uid);
    } catch (error) {
      console.error('Error verifying Firebase Auth user:', error);
    }
    
    // Step 4: Verify user exists in database
    try {
      const verifiedDbUser = await storage.getUserByUsername(testUser.userData.username);
      if (verifiedDbUser) {
        console.log('Verified database user exists:', verifiedDbUser.id);
      } else {
        console.error('Database user not found!');
      }
    } catch (error) {
      console.error('Error verifying database user:', error);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing auth persistence:', error);
  } finally {
    // Clean up Firebase app
    await app.delete();
  }
}

// Run the function
testAuthPersistence();
