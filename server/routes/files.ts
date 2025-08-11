import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { ApiError, Errors } from '../middleware/errorHandler';
import { secretManager } from '../services/secretManager';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'), false);
    }
  },
});

/**
 * Upload professional image
 */
router.post('/upload-professional-image', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const userId = req.body.userId;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }

    if (!userId) {
      throw Errors.badRequest('User ID is required');
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'professional-images');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `professional-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const baseUrl = process.env.FILE_SERVE_URL || 'http://localhost:3001';
    const relativePath = path.relative(path.join(process.cwd(), 'uploads'), finalPath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Save file metadata to database
    const fileData = {
      userId: parseInt(userId),
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType: 'professional_image',
      metadata: {
        width: null,
        height: null,
        encoding: file.encoding,
      }
    };

    const savedFile = await storage.createFile(fileData);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: savedFile.fileUrl,
        originalName: savedFile.originalName,
        size: savedFile.size,
      },
      message: 'Professional image uploaded successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Upload profile image
 */
router.post('/upload-profile-image', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const userId = req.body.userId;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }

    if (!userId) {
      throw Errors.badRequest('User ID is required');
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-images');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `profile-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const baseUrl = process.env.FILE_SERVE_URL || 'http://localhost:3001';
    const relativePath = path.relative(path.join(process.cwd(), 'uploads'), finalPath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Save file metadata to database
    const fileData = {
      userId: parseInt(userId),
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType: 'profile_image',
      metadata: {
        width: null, // Could be populated with image dimensions
        height: null,
        encoding: file.encoding,
      }
    };

    const savedFile = await storage.createFile(fileData);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: savedFile.fileUrl,
        originalName: savedFile.originalName,
        size: savedFile.size,
      },
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Upload CV file
 */
router.post('/upload-cv', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const userId = req.body.userId;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }

    if (!userId) {
      throw Errors.badRequest('User ID is required');
    }

    // Validate file is a PDF
    if (file.mimetype !== 'application/pdf') {
      throw Errors.badRequest('CV must be a PDF file');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `cv-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const baseUrl = process.env.FILE_SERVE_URL || 'http://localhost:3001';
    const relativePath = path.relative(path.join(process.cwd(), 'uploads'), finalPath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Save file metadata to database
    const fileData = {
      userId: parseInt(userId),
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType: 'cv',
      metadata: {
        encoding: file.encoding,
      }
    };

    const savedFile = await storage.createFile(fileData);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: savedFile.fileUrl,
        originalName: savedFile.originalName,
        size: savedFile.size,
      },
      message: 'CV uploaded successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Generic file upload
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const userId = req.body.userId;
    const fileType = req.body.fileType || 'general';

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }

    if (!userId) {
      throw Errors.badRequest('User ID is required');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', fileType);
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${fileType}-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const baseUrl = process.env.FILE_SERVE_URL || 'http://localhost:3001';
    const relativePath = path.relative(path.join(process.cwd(), 'uploads'), finalPath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Save file metadata to database
    const fileData = {
      userId: parseInt(userId),
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType,
      metadata: {
        encoding: file.encoding,
      }
    };

    const savedFile = await storage.createFile(fileData);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: savedFile.fileUrl,
        originalName: savedFile.originalName,
        size: savedFile.size,
        fileType: savedFile.fileType,
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get user files
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      throw Errors.badRequest('Invalid user ID');
    }

    const files = await storage.getFilesByUser(userId);

    res.json({
      success: true,
      data: files,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Delete file
 */
router.delete('/:fileId', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.fileId);
    
    if (isNaN(fileId)) {
      throw Errors.badRequest('Invalid file ID');
    }

    // Get file info first
    const file = await storage.getFile(fileId);
    if (!file) {
      throw Errors.notFound('File not found');
    }

    // Delete file from filesystem
    if (fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }

    // Delete from database
    const deleted = await storage.deleteFile(fileId);

    res.json({
      success: true,
      data: { deleted },
      message: 'File deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

export default router;