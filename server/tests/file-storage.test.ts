import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseStorage } from '../storage';
import { initializeDatabase, getDB, getSqliteConnection } from '../db';
import { files, users } from '@shared/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Create a test instance of DatabaseStorage
const storage = new DatabaseStorage();
let db: ReturnType<typeof getDB>;

// Test file data
const testFilePath = path.join(process.cwd(), 'uploads/test-file.txt');
const testFileUrl = 'http://localhost:3001/uploads/test-file.txt';
const testUserIds = [10001, 10002];

describe('File Storage', () => {
  // Create test file
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'sqlite:./test.db';

    await initializeDatabase();
    db = getDB();

    await db.delete(files).where(inArray(files.userId, testUserIds));
    await db.delete(users).where(inArray(users.id, testUserIds));

    const sqlite = getSqliteConnection();
    if (sqlite) {
      const insertUser = sqlite.prepare(`
        INSERT OR REPLACE INTO users (id, username, password, email, name, firebase_uid, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertUser.run(
        testUserIds[0],
        'file-storage-user-1',
        'test-password',
        'file-storage-user-1@example.com',
        'File Storage User 1',
        'file-storage-user-1',
        'user'
      );
      insertUser.run(
        testUserIds[1],
        'file-storage-user-2',
        'test-password',
        'file-storage-user-2@example.com',
        'File Storage User 2',
        'file-storage-user-2',
        'user'
      );
    } else {
      await db.insert(users).values([
        {
          id: testUserIds[0],
          username: 'file-storage-user-1',
          email: 'file-storage-user-1@example.com',
          name: 'File Storage User 1',
          firebaseUid: 'file-storage-user-1',
          role: 'user',
        },
        {
          id: testUserIds[1],
          username: 'file-storage-user-2',
          email: 'file-storage-user-2@example.com',
          name: 'File Storage User 2',
          firebaseUid: 'file-storage-user-2',
          role: 'user',
        },
      ]);
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test file
    fs.writeFileSync(testFilePath, 'This is a test file');
  });

  // Clean up test data after tests
  afterAll(async () => {
    // Delete test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    // Delete test data from database
    await db.delete(files).where(inArray(files.userId, testUserIds));
    await db.delete(users).where(inArray(users.id, testUserIds));
  });

  // Clean up before each test
  beforeEach(async () => {
    await db.delete(files).where(inArray(files.userId, testUserIds));
  });

  it('should create a file record', async () => {
    const fileData = {
      userId: testUserIds[0],
      originalName: 'test-file.txt',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'text/plain',
      size: 19, // Size of 'This is a test file'
      fileType: 'test',
      metadata: { test: true },
    };

    const createdFile = await storage.createFile(fileData);

    expect(createdFile).toBeDefined();
    expect(createdFile.id).toBeDefined();
    expect(createdFile.originalName).toBe(fileData.originalName);
    expect(createdFile.fileUrl).toBe(fileData.fileUrl);
  });

  it('should retrieve a file by ID', async () => {
    // Create a file first
    const fileData = {
      userId: testUserIds[0],
      originalName: 'test-file.txt',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'text/plain',
      size: 19,
      fileType: 'test',
      metadata: { test: true },
    };

    const createdFile = await storage.createFile(fileData);

    // Retrieve the file
    const retrievedFile = await storage.getFile(createdFile.id);

    expect(retrievedFile).toBeDefined();
    expect(retrievedFile?.id).toBe(createdFile.id);
    expect(retrievedFile?.originalName).toBe(fileData.originalName);
  });

  it('should retrieve files by user ID', async () => {
    // Create files for two different users
    const fileData1 = {
      userId: testUserIds[0],
      originalName: 'user1-file.txt',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'text/plain',
      size: 19,
      fileType: 'test',
      metadata: { test: true },
    };

    const fileData2 = {
      userId: testUserIds[1],
      originalName: 'user2-file.txt',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'text/plain',
      size: 19,
      fileType: 'test',
      metadata: { test: true },
    };

    await storage.createFile(fileData1);
    await storage.createFile(fileData2);

    // Retrieve files for user 1
    const user1Files = await storage.getFilesByUser(testUserIds[0]);

    expect(user1Files).toBeDefined();
    expect(user1Files.length).toBe(1);
    expect(user1Files[0].originalName).toBe('user1-file.txt');
  });

  it('should retrieve files by file type', async () => {
    // Create files with different types
    const fileData1 = {
      userId: testUserIds[0],
      originalName: 'profile-image.jpg',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'image/jpeg',
      size: 19,
      fileType: 'profile_image',
      metadata: { test: true },
    };

    const fileData2 = {
      userId: testUserIds[0],
      originalName: 'cv.pdf',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'application/pdf',
      size: 19,
      fileType: 'cv',
      metadata: { test: true },
    };

    await storage.createFile(fileData1);
    await storage.createFile(fileData2);

    // Retrieve profile image files
    const profileImages = await storage.getFilesByType('profile_image');

    expect(profileImages).toBeDefined();
    expect(profileImages.length).toBe(1);
    expect(profileImages[0].originalName).toBe('profile-image.jpg');
  });

  it('should delete a file', async () => {
    // Create a file
    const fileData = {
      userId: testUserIds[0],
      originalName: 'test-file.txt',
      storagePath: testFilePath,
      fileUrl: testFileUrl,
      mimeType: 'text/plain',
      size: 19,
      fileType: 'test',
      metadata: { test: true },
    };

    const createdFile = await storage.createFile(fileData);

    // Delete the file
    const deleted = await storage.deleteFile(createdFile.id);

    expect(deleted).toBe(true);

    // Try to retrieve the deleted file
    const retrievedFile = await storage.getFile(createdFile.id);

    expect(retrievedFile).toBeUndefined();
  });
});
