import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import firebaseApp, { db } from './utils/firebase-admin.js';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  // Check if Firebase is initialized
  const firebaseStatus = firebaseApp
    ? 'Firebase connected'
    : 'Firebase not configured (using mock data)';

  res.json({
    message: 'Welcome to WorkWise SA API',
    version: '1.0.0',
    status: 'Server is running',
    firebase: firebaseStatus,
    endpoints: {
      '/api/enhance-image': 'POST - Enhance profile pictures using AI',
      '/api/scan-cv': 'POST - Scan and analyze CV documents',
      '/api/cv/generate-summary': 'POST - Generate professional summary',
      '/api/cv/generate-job-description': 'POST - Generate job description',
      '/api/cv/translate': 'POST - Translate text',
      '/api/cv/claude/analyze-image': 'POST - Analyze image with Claude AI',
      '/api/recommendations': 'GET/POST - Job recommendations',
      '/api/categories': 'GET - Job categories',
      '/api/jobs/featured': 'GET - Featured job listings',
      '/api/companies': 'GET - Company listings',
      '/api/users': 'POST - Create a new user'
    }
  });
});

// Example endpoint to test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    // Simple test to check if Firebase is connected
    const snapshot = await db.collection('test').doc('connection').get();

    // Check if we're using mock data
    const isMockData = !firebaseApp || (snapshot && snapshot.id === 'mock-id');

    res.json({
      success: true,
      message: isMockData
        ? 'Using mock Firebase implementation (Firebase credentials not configured)'
        : 'Firebase connection successful',
      data: snapshot.exists ? snapshot.data() : { status: 'No test document found, but connection works' },
      isMockData: isMockData
    });
  } catch (error) {
    console.error('Firebase connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase connection failed',
      error: error.message
    });
  }
});

// Export the serverless function
export const handler = serverless(app);
