import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { InsertFile } from '@shared/schema';
import { secretManager } from './services/secretManager';

/**
 * Service for handling file operations on the server
 */
export const fileService = {
  /**
   * Save a file to the local filesystem and store metadata in the database
   * @param file The file object from multer
   * @param userId The user ID associated with the file
   * @param fileType The type of file (e.g., 'profile_image', 'cv')
   * @returns Promise with the file metadata
   */
  async saveFile(file: Express.Multer.File, userId: number | null, fileType: string) {
    try {
      // Ensure upload directory exists
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create user-specific directory if userId is provided
      let filePath = uploadDir;
      if (userId) {
        const userDir = path.join(uploadDir, `user-${userId}`);
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        filePath = userDir;
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.originalname}`;
      const fullPath = path.join(filePath, uniqueFilename);
      
      // Move the file from temp upload location to final destination
      fs.copyFileSync(file.path, fullPath);
      fs.unlinkSync(file.path); // Remove the temp file
      
      // Generate a URL for the file
      const baseUrl = (await secretManager.getSecret('FILE_SERVE_URL')) || 'http://localhost:3001/uploads';
      const relativePath = path.relative(uploadDir, fullPath).replace(/\\/g, '/');
      const fileUrl = `${baseUrl}/${relativePath}`;
      
      // Store file metadata in the database
      const fileData: InsertFile = {
        userId: userId || undefined,
        originalName: file.originalname,
        storagePath: fullPath,
        fileUrl,
        mimeType: file.mimetype,
        size: file.size,
        fileType,
        metadata: {
          encoding: file.encoding,
          fieldname: file.fieldname
        }
      };
      
      const savedFile = await storage.createFile(fileData);
      return savedFile;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  },

  /**
   * Delete a file from the filesystem and database
   * @param fileId The ID of the file to delete
   * @returns Promise indicating success
   */
  async deleteFile(fileId: number) {
    try {
      // Get file metadata from database
      const file = await storage.getFile(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Delete the file from filesystem
      if (fs.existsSync(file.storagePath)) {
        fs.unlinkSync(file.storagePath);
      }
      
      // Delete metadata from database
      return await storage.deleteFile(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Get all files for a specific user
   * @param userId The user ID
   * @returns Promise with array of files
   */
  async getUserFiles(userId: number) {
    return await storage.getFilesByUser(userId);
  },

  /**
   * Get all files of a specific type
   * @param fileType The type of files to retrieve
   * @returns Promise with array of files
   */
  async getFilesByType(fileType: string) {
    return await storage.getFilesByType(fileType);
  }
};
