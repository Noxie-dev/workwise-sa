import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import multer from 'multer';
import { getStorage } from 'firebase-admin/storage';
import firebaseApp from './utils/firebase-admin.js';

// Create Express app
const app = express();

// Middleware
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'File upload service is running',
    endpoints: [
      'POST /upload-profile-image',
      'POST /upload-professional-image'
    ],
    firebase: firebaseApp ? 'Connected' : 'Using mock (no credentials)'
  });
});

// Configure multer for file uploads (memory storage for serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'), false);
    }
  },
});

// Helper function to upload file to Firebase Storage
async function uploadToFirebaseStorage(file, userId, fileType) {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }

  const bucket = getStorage().bucket();
  const timestamp = Date.now();
  const extension = file.originalname.split('.').pop();
  const fileName = `${fileType}/${userId}/${fileType}-${timestamp}.${extension}`;
  
  const fileUpload = bucket.file(fileName);
  
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        userId: userId,
        fileType: fileType,
        originalName: file.originalname
      }
    }
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await fileUpload.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        console.error('Error making file public:', error);
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
}

/**
 * Upload professional image
 */
app.post('/upload-professional-image', upload.single('file'), async (req, res) => {
  try {
    console.log('Professional image upload request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    
    const file = req.file;
    const userId = req.body.userId;

    console.log('User ID:', userId);
    console.log('File details:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');

    if (!file) {
      console.log('Error: No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!userId) {
      console.log('Error: No user ID provided');
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      console.log('Error: Invalid file type:', file.mimetype);
      return res.status(400).json({
        success: false,
        error: 'File must be an image'
      });
    }

    console.log('Starting Firebase upload...');
    // Upload to Firebase Storage
    const fileUrl = await uploadToFirebaseStorage(file, userId, 'professional-images');
    console.log('Upload successful, URL:', fileUrl);

    res.json({
      success: true,
      data: {
        fileUrl: fileUrl,
        originalName: file.originalname,
        size: file.size,
      },
      message: 'Professional image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload professional image'
    });
  }
});

/**
 * Upload profile image
 */
app.post('/upload-profile-image', upload.single('file'), async (req, res) => {
  try {
    console.log('Profile image upload request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    
    const file = req.file;
    const userId = req.body.userId;

    console.log('User ID:', userId);
    console.log('File details:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');

    if (!file) {
      console.log('Error: No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!userId) {
      console.log('Error: No user ID provided');
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      console.log('Error: Invalid file type:', file.mimetype);
      return res.status(400).json({
        success: false,
        error: 'File must be an image'
      });
    }

    console.log('Starting Firebase upload...');
    // Upload to Firebase Storage
    const fileUrl = await uploadToFirebaseStorage(file, userId, 'profile-images');
    console.log('Upload successful, URL:', fileUrl);

    res.json({
      success: true,
      data: {
        fileUrl: fileUrl,
        originalName: file.originalname,
        size: file.size,
      },
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload profile image'
    });
  }
});

// Export the serverless function
export const handler = serverless(app);