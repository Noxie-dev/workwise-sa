import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import firebaseApp, { db } from './utils/firebase-admin.js';
import * as admin from 'firebase-admin';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    if (!firebaseApp) {
      // Mock authentication for development without Firebase credentials
      console.warn('Using mock authentication (Firebase not configured)');
      req.user = { uid: 'mock-user-id', email: 'mock@example.com', role: 'user' };
      return next();
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Get additional user data from Firestore if needed
    try {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        req.userData = userDoc.data();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Continue even if user data fetch fails
    }
    
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Create a new user
app.post('/create', async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (!firebaseApp) {
      return res.status(200).json({
        success: true,
        message: 'Mock user created (Firebase not configured)',
        user: { uid: 'mock-user-id', email, displayName }
      });
    }
    
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber
    });
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || '',
      phoneNumber: phoneNumber || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'user'
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Get current user profile
app.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.name || req.userData?.displayName || '',
        phoneNumber: req.userData?.phoneNumber || '',
        role: req.userData?.role || 'user',
        ...req.userData
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// Export the serverless function
export const handler = serverless(app);
