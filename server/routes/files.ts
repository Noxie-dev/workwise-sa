import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { Errors } from '../middleware/errorHandler';
import { type AuthenticatedRequest, verifyFirebaseToken } from '../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

const router = Router();

async function resolveUserId(userIdParam: string): Promise<number | null> {
  const numericId = parseInt(userIdParam, 10);
  if (!Number.isNaN(numericId)) {
    return numericId;
  }

  const user = await storage.getUserByFirebaseUid(userIdParam);
  return user?.id ?? null;
}

async function resolveTargetUserId(req: AuthenticatedRequest, userIdParam?: string): Promise<number> {
  const authUser = await resolveAuthenticatedDatabaseUser(req.user!);
  const targetUserId = userIdParam ? await resolveUserId(userIdParam) : authUser.id;

  if (!targetUserId) {
    throw Errors.notFound('User not found');
  }

  if (authUser.id !== targetUserId && authUser.role !== 'admin') {
    throw Errors.forbidden('You can only manage your own files');
  }

  return targetUserId;
}

function safeFileType(value: unknown) {
  const fileType = typeof value === 'string' && value.trim() ? value.trim() : 'general';
  if (!/^[a-z0-9_-]{1,40}$/i.test(fileType)) {
    throw Errors.badRequest('Invalid file type');
  }
  return fileType;
}

function cleanupTempFile(file?: Express.Multer.File) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

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
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'));
    }
  },
});

router.use(verifyFirebaseToken);

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

    const resolvedUserId = await resolveTargetUserId(req as AuthenticatedRequest, userId);

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'professional-images');
    const userDir = path.join(uploadDir, `user-${resolvedUserId}`);

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
      userId: resolvedUserId,
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
      },
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
      message: 'Professional image uploaded successfully',
    });
  } catch (error) {
    cleanupTempFile(req.file);
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

    const resolvedUserId = await resolveTargetUserId(req as AuthenticatedRequest, userId);

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-images');
    const userDir = path.join(uploadDir, `user-${resolvedUserId}`);

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
      userId: resolvedUserId,
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
      },
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
      message: 'Profile image uploaded successfully',
    });
  } catch (error) {
    cleanupTempFile(req.file);
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

    const resolvedUserId = await resolveTargetUserId(req as AuthenticatedRequest, userId);

    // Validate file is a PDF
    if (file.mimetype !== 'application/pdf') {
      throw Errors.badRequest('CV must be a PDF file');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
    const userDir = path.join(uploadDir, `user-${resolvedUserId}`);

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
      userId: resolvedUserId,
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType: 'cv',
      metadata: {
        encoding: file.encoding,
      },
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
      message: 'CV uploaded successfully',
    });
  } catch (error) {
    cleanupTempFile(req.file);
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
    const fileType = safeFileType(req.body.fileType);

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }

    const resolvedUserId = await resolveTargetUserId(req as AuthenticatedRequest, userId);

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', fileType);
    const userDir = path.join(uploadDir, `user-${resolvedUserId}`);

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
      userId: resolvedUserId,
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileType,
      metadata: {
        encoding: file.encoding,
      },
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
      message: 'File uploaded successfully',
    });
  } catch (error) {
    cleanupTempFile(req.file);
    next(error);
  }
});

/**
 * Get user files
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const userId = await resolveTargetUserId(req as AuthenticatedRequest, req.params.userId);

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
    await resolveTargetUserId(req as AuthenticatedRequest, String(file.userId));

    // Delete file from filesystem
    if (fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }

    // Delete from database
    const deleted = await storage.deleteFile(fileId);

    res.json({
      success: true,
      data: { deleted },
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
