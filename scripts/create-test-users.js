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

// Test users to create
const testUsers = [
  {
    email: 'testuser1@example.com',
    password: 'Test123!',
    displayName: 'Test User 1',
    userData: {
      username: 'testuser1',
      email: 'testuser1@example.com',
      name: 'Test User 1',
      location: 'Cape Town',
      bio: 'Test user for persistence testing',
      phoneNumber: '0123456789',
      willingToRelocate: true,
      notificationPreference: true
    }
  },
  {
    email: 'testuser2@example.com',
    password: 'Test123!',
    displayName: 'Test User 2',
    userData: {
      username: 'testuser2',
      email: 'testuser2@example.com',
      name: 'Test User 2',
      location: 'Johannesburg',
      bio: 'Another test user for persistence testing',
      phoneNumber: '0987654321',
      willingToRelocate: false,
      notificationPreference: false
    }
  }
];

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    for (const user of testUsers) {
      try {
        // Check if user already exists in Firebase Auth
        const existingUser = await admin.auth().getUserByEmail(user.email).catch(() => null);

        if (existingUser) {
          console.log(`User ${user.email} already exists in Firebase Auth, skipping creation`);
        } else {
          // Create user in Firebase Auth
          const userRecord = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            emailVerified: true
          });

          console.log(`Created Firebase Auth user: ${userRecord.uid}`);
        }

        // Check if user exists in database
        const existingDbUser = await storage.getUserByUsername(user.userData.username);

        if (existingDbUser) {
          console.log(`User ${user.userData.username} already exists in database, skipping creation`);
        } else {
          // Create user in database
          const dbUser = await storage.createUser(user.userData);
          console.log(`Created database user: ${dbUser.id}`);
        }
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }

    console.log('Test users created successfully');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    // Clean up Firebase app
    await app.delete();
  }
}

// Run the function
createTestUsers();
