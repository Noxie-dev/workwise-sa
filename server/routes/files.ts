import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { Errors } from '../middleware/errorHandler';
import { verifyFirebaseToken } from '../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';
import { optimizeUploadedImage } from '../services/imageOptimization';
import { getUploadRoot } from '../services/uploadVolume';

const router = Router();
const uploadRoot = getUploadRoot();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(uploadRoot, 'temp'),
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
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'));
    }
  },
});

const fileExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

function assertFileSignature(file: Express.Multer.File) {
  let header: Buffer;
  try {
    header = fs.readFileSync(file.path).subarray(0, 12);
  } catch {
    throw Errors.badRequest('Uploaded file could not be inspected');
  }

  const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = header.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isGif = header.subarray(0, 6).toString('ascii') === 'GIF87a' || header.subarray(0, 6).toString('ascii') === 'GIF89a';
  const isWebp = header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  const isPdf = header.subarray(0, 5).toString('ascii') === '%PDF-';

  const matchesMime = file.mimetype === 'application/pdf'
    ? isPdf
    : file.mimetype === 'image/png'
      ? isPng
      : file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg'
        ? isJpeg
        : file.mimetype === 'image/gif'
          ? isGif
          : file.mimetype === 'image/webp'
            ? isWebp
            : false;

  if (!matchesMime) {
    throw Errors.badRequest('Uploaded file content does not match its declared type');
  }
}

function extensionForMime(mimeType: string) {
  return fileExtensions[mimeType] || '.bin';
}

async function persistFileMetadata(fileData: any, finalPath: string) {
  try {
    return await storage.createFile(fileData);
  } catch (error) {
    if (fs.existsSync(finalPath)) {
      try {
        fs.unlinkSync(finalPath);
      } catch {
        // Preserve the persistence error; cleanup is best effort.
      }
    }
    // Keep the managed user directory present even when the only upload in it
    // is rolled back, which also makes volume health checks deterministic.
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    throw error;
  }
}

// Authenticate before Multer writes an incoming file to temporary disk.
router.use(verifyFirebaseToken);

async function getAuthenticatedDatabaseUser(req: any) {
  if (!req.user?.uid) {
    throw Errors.authentication('User authentication required');
  }

  return resolveAuthenticatedDatabaseUser(req.user);
}

function assertUserAccess(
  dbUser: { id: number; role?: string | null },
  requestedUserId: number | null,
) {
  if (requestedUserId === null) {
    throw Errors.forbidden('File is not assigned to an owner');
  }

  if (dbUser.role !== 'admin' && dbUser.id !== requestedUserId) {
    throw Errors.forbidden('You can only access your own files');
  }
}

function secureDownloadUrl(fileId: number) {
  const baseUrl = process.env.FILE_SERVE_URL || 'http://localhost:3001';
  return `${baseUrl}/api/files/${fileId}/download`;
}

/**
 * Upload professional image
 */
router.post('/upload-professional-image', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const userId = dbUser.id;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }
    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }
    assertFileSignature(file);

    // Create user-specific upload directory
    const uploadDir = path.join(uploadRoot, 'professional-images');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const optimized = await optimizeUploadedImage(
      file.path,
      path.join(userDir, `professional-${timestamp}`),
      { maxWidth: 1600, maxHeight: 1200 },
    );
    const finalPath = optimized.path;

    // Generate file URL
    const fileUrl = '';

    // Save file metadata to database
    const fileData = {
      userId,
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: optimized.optimized ? optimized.mimeType : file.mimetype,
      size: optimized.size,
      fileType: 'professional_image',
      metadata: {
        width: optimized.width,
        height: optimized.height,
        format: optimized.format,
        optimized: optimized.optimized,
        encoding: file.encoding,
      }
    };

    const savedFile = await persistFileMetadata(fileData, finalPath);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: secureDownloadUrl(savedFile.id),
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
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const userId = dbUser.id;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }
    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw Errors.badRequest('File must be an image');
    }
    assertFileSignature(file);

    // Create user-specific upload directory
    const uploadDir = path.join(uploadRoot, 'profile-images');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const optimized = await optimizeUploadedImage(
      file.path,
      path.join(userDir, `profile-${timestamp}`),
      { maxWidth: 512, maxHeight: 512 },
    );
    const finalPath = optimized.path;

    // Generate file URL
    const fileUrl = '';

    // Save file metadata to database
    const fileData = {
      userId,
      originalName: file.originalname,
      storagePath: finalPath,
      fileUrl,
      mimeType: optimized.optimized ? optimized.mimeType : file.mimetype,
      size: optimized.size,
      fileType: 'profile_image',
      metadata: {
        width: optimized.width,
        height: optimized.height,
        format: optimized.format,
        optimized: optimized.optimized,
        encoding: file.encoding,
      }
    };

    const savedFile = await persistFileMetadata(fileData, finalPath);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: secureDownloadUrl(savedFile.id),
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
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const userId = dbUser.id;

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }
    // Validate file is a PDF
    if (file.mimetype !== 'application/pdf') {
      throw Errors.badRequest('CV must be a PDF file');
    }
    assertFileSignature(file);

    // Create user-specific upload directory
    const uploadDir = path.join(uploadRoot, 'cvs');
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = extensionForMime(file.mimetype);
    const filename = `cv-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const fileUrl = '';

    // Save file metadata to database
    const fileData = {
      userId,
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

    const savedFile = await persistFileMetadata(fileData, finalPath);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: secureDownloadUrl(savedFile.id),
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
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const userId = dbUser.id;
    const fileType = req.body.fileType || 'general';

    if (!file) {
      throw Errors.badRequest('No file uploaded');
    }
    assertFileSignature(file);

    if (!['general', 'professional_image', 'profile_image', 'cv'].includes(fileType)) {
      throw Errors.badRequest('Invalid file type');
    }

    // Create user-specific upload directory
    const uploadDir = path.join(uploadRoot, fileType);
    const userDir = path.join(uploadDir, `user-${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = extensionForMime(file.mimetype);
    const filename = `${fileType}-${timestamp}${extension}`;
    const finalPath = path.join(userDir, filename);

    // Move file from temp to final location
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path); // Clean up temp file

    // Generate file URL
    const fileUrl = '';

    // Save file metadata to database
    const fileData = {
      userId,
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

    const savedFile = await persistFileMetadata(fileData, finalPath);

    res.json({
      success: true,
      data: {
        fileId: savedFile.id,
        fileUrl: secureDownloadUrl(savedFile.id),
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
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      throw Errors.badRequest('Invalid user ID');
    }

    assertUserAccess(dbUser, userId);
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
 * Download a private file.
 */
router.get('/:fileId/download', async (req, res, next) => {
  try {
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const fileId = parseInt(req.params.fileId);

    if (isNaN(fileId)) {
      throw Errors.badRequest('Invalid file ID');
    }

    const file = await storage.getFile(fileId);
    if (!file) {
      throw Errors.notFound('File not found');
    }

    assertUserAccess(dbUser, file.userId);

    const uploadsRoot = uploadRoot;
    const resolvedPath = path.resolve(file.storagePath);
    if (!resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)) {
      throw Errors.forbidden('File path is outside the managed upload directory');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw Errors.notFound('Stored file not found');
    }

    // Upload filenames are immutable, so private long-lived caching avoids
    // repeatedly transferring profile assets while preserving auth checks.
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    res.type(file.mimeType);
    res.sendFile(resolvedPath);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete file
 */
router.delete('/:fileId', async (req, res, next) => {
  try {
    const dbUser = await getAuthenticatedDatabaseUser(req);
    const fileId = parseInt(req.params.fileId);
    
    if (isNaN(fileId)) {
      throw Errors.badRequest('Invalid file ID');
    }

    // Get file info first
    const file = await storage.getFile(fileId);
    if (!file) {
      throw Errors.notFound('File not found');
    }

    assertUserAccess(dbUser, file.userId);

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

// Multer writes to a local temporary file before the route handler runs. Make
// sure validation, authorization, and persistence failures do not leave
// unbounded temporary uploads behind.
router.use((error: unknown, req: any, _res: any, next: (error: unknown) => void) => {
  const tempPath = req.file?.path;
  if (tempPath && fs.existsSync(tempPath)) {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Preserve the original request error; cleanup is best effort.
    }
  }
  next(error);
});

export default router;
