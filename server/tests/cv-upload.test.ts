import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';

// Create a test server
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'test-uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Mock CV scanning endpoint
app.post('/api/scan-cv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.tif', '.tiff'];

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Mock successful response
    res.json({
      success: true,
      data: {
        personalInfo: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
        },
        education: {
          highestEducation: 'Bachelor\'s Degree',
          schoolName: 'Test University',
          yearCompleted: '2023',
        },
        experience: {
          jobTitle: 'Software Developer',
          employer: 'Test Company',
          description: 'Test job description',
        },
        skills: {
          skills: ['JavaScript', 'Python', 'React'],
          languages: ['English', 'Spanish'],
        }
      }
    });
  } catch (error) {
    console.error('CV scanning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process CV'
    });
  }
});

describe('CV Upload Functionality', () => {
  const testUploadDir = 'test-uploads';
  
  beforeAll(() => {
    // Create test upload directory
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir);
    }
  });

  afterAll(() => {
    // Clean up test upload directory
    if (fs.existsSync(testUploadDir)) {
      fs.rmdirSync(testUploadDir, { recursive: true });
    }
  });

  it('should handle PDF file upload', async () => {
    // Create a test PDF file
    const testFilePath = path.join(testUploadDir, 'test.pdf');
    fs.writeFileSync(testFilePath, 'Test PDF content');

    const response = await request(app)
      .post('/api/scan-cv')
      .attach('file', testFilePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.personalInfo).toBeDefined();
    expect(response.body.data.education).toBeDefined();
    expect(response.body.data.experience).toBeDefined();
    expect(response.body.data.skills).toBeDefined();
  });

  it('should handle image file upload', async () => {
    // Create a test image file
    const testFilePath = path.join(testUploadDir, 'test.jpg');
    fs.writeFileSync(testFilePath, 'Test image content');

    const response = await request(app)
      .post('/api/scan-cv')
      .attach('file', testFilePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('should reject invalid file types', async () => {
    // Create a test file with invalid extension
    const testFilePath = path.join(testUploadDir, 'test.txt');
    fs.writeFileSync(testFilePath, 'Test content');

    const response = await request(app)
      .post('/api/scan-cv')
      .attach('file', testFilePath);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid file type');
  });

  it('should handle missing file', async () => {
    const response = await request(app)
      .post('/api/scan-cv');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No file uploaded');
  });
}); 