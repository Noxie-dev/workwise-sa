import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { db } from './utils/firebase-admin.js';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Sample job categories for entry-level positions
const sampleCategories = [
  {
    id: 1,
    name: 'General Worker',
    description: 'Entry-level positions requiring minimal experience or qualifications.',
    icon: 'tool'
  },
  {
    id: 2,
    name: 'Construction Worker',
    description: 'Basic construction roles including site cleaning, material handling, and assisting skilled workers.',
    icon: 'hard-hat'
  },
  {
    id: 3,
    name: 'Picker/Packer',
    description: 'Warehouse roles involving selecting and packaging items for shipment.',
    icon: 'package'
  },
  {
    id: 4,
    name: 'Warehouse Assistant',
    description: 'Entry-level warehouse positions involving stock management and inventory tasks.',
    icon: 'box'
  },
  {
    id: 5,
    name: 'Cashier',
    description: 'Retail positions handling customer transactions and basic customer service.',
    icon: 'credit-card'
  },
  {
    id: 6,
    name: 'Cleaner',
    description: 'Janitorial and cleaning positions in various environments.',
    icon: 'spray-can'
  },
  {
    id: 7,
    name: 'Security Guard',
    description: 'Basic security positions monitoring premises and controlling access.',
    icon: 'shield'
  },
  {
    id: 8,
    name: 'Admin Clerk',
    description: 'Entry-level administrative positions handling basic office tasks.',
    icon: 'file-text'
  },
  {
    id: 9,
    name: 'Retail Assistant',
    description: 'Entry-level retail positions assisting customers and maintaining store appearance.',
    icon: 'shopping-bag'
  },
  {
    id: 10,
    name: 'Call Center Agent',
    description: 'Customer service positions handling inquiries via phone or chat.',
    icon: 'phone'
  }
];

// Job categories endpoint
app.get('/', async (req, res) => {
  try {
    // For now, we'll just return the sample categories
    // In a production environment, you would fetch this from Firestore
    // when the Firebase credentials are properly configured

    // Try to fetch from Firestore if available, otherwise use sample data
    let categories = sampleCategories;

    try {
      // This will use the mock implementation if Firebase is not initialized
      const categoriesSnapshot = await db.collection('categories').get();

      // If we have actual data from Firestore and it's not empty, use it
      if (categoriesSnapshot && categoriesSnapshot.docs && categoriesSnapshot.docs.length > 0 && !categoriesSnapshot.docs[0].id.includes('mock')) {
        categories = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (dbError) {
      console.log('Using sample categories data:', dbError.message);
      // Continue with sample data
    }

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Export the serverless function
export const handler = serverless(app);
