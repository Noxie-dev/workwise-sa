import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import firebaseApp, { db } from './utils/firebase-admin.js';
import * as admin from 'firebase-admin';
import { verifyFirebaseToken, isAdmin } from '../../server/middleware/auth';

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Create a new user
app.post('/create', isAdmin, async (req, res) => {
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
