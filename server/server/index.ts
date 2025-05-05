// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileService } from '../fileService';
import { getJobDistribution, getJobRecommendations, getSkillsAnalysis } from '../routes/dashboard';
import { db as storage } from '../db';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { setupSwagger } from '../utils/swagger';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware); // Add request ID to each request

// Log all requests
app.use((req, res, next) => {
  logger.info({
    message: `Incoming request: ${req.method} ${req.path}`,
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Serve static files from uploads directory
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// Setup Swagger documentation
setupSwagger(app);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns information about the API and available endpoints
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to WorkWise SA API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                 status:
 *                   type: string
 *                   example: Server is running
 */
// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WorkWise SA API',
    version: '1.0.0',
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
      '/api/users': 'POST - Create a new user',
      '/api/dashboard/job-distribution': 'GET - Job distribution data for dashboard',
      '/api/dashboard/job-recommendations': 'GET - Job recommendations for dashboard',
      '/api/dashboard/skills-analysis': 'GET - Skills analysis data for dashboard'
    },
    status: 'Server is running'
  });
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_GENAI_API_KEY || '');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
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

// Add new endpoint for CV scanning
app.post('/api/scan-cv', upload.single('file'), async (req, res) => {
  let filePath = '';
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Read file content based on type
    let fileContent = '';
    if (['.pdf', '.doc', '.docx'].includes(fileExtension)) {
      // For PDF and Word documents, we'll need to extract text
      // This is a simplified version - in production, you'd want to use a proper PDF/DOC parser
      fileContent = fs.readFileSync(filePath, 'utf-8');
    } else if (['.jpg', '.jpeg', '.png', '.tif', '.tiff'].includes(fileExtension)) {
      // For images, we'll use Gemini's vision capabilities
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      const imageData = fs.readFileSync(filePath);
      const imageBase64 = Buffer.from(imageData).toString('base64');

      const result = await model.generateContent([
        "Extract the following information from this CV/resume:",
        "1. Personal Information (name, contact details, location)",
        "2. Education (highest education, school name, year completed, achievements)",
        "3. Work Experience (current/previous jobs, dates, descriptions)",
        "4. Skills (technical skills, soft skills, languages)",
        "5. Additional Information (drivers license, transport, etc.)",
        "Format the response as a JSON object with these exact keys:",
        "personalInfo, education, experience, skills",
        "Make sure the response is valid JSON and properly formatted.",
        {
          inlineData: {
            mimeType: `image/${fileExtension.slice(1)}`,
            data: imageBase64
          }
        }
      ]);

      const response = await result.response;
      fileContent = response.text();
    }

    // Parse the response and return structured data
    let parsedContent;
    try {
      // First try to parse as JSON
      parsedContent = JSON.parse(fileContent);
    } catch (parseError) {
      console.warn('Failed to parse as JSON, attempting to structure response:', parseError);
      // If JSON parsing fails, try to structure the response
      parsedContent = {
        personalInfo: {
          fullName: extractValue(fileContent, /name:?\s*([^\n]+)/i),
          phoneNumber: extractValue(fileContent, /phone:?\s*([^\n]+)/i),
          location: extractValue(fileContent, /location:?\s*([^\n]+)/i),
        },
        education: {
          highestEducation: extractValue(fileContent, /education:?\s*([^\n]+)/i),
          schoolName: extractValue(fileContent, /school:?\s*([^\n]+)/i),
          yearCompleted: extractValue(fileContent, /year:?\s*([^\n]+)/i),
          achievements: extractValue(fileContent, /achievements:?\s*([^\n]+)/i),
        },
        experience: {
          hasExperience: true,
          jobTitle: extractValue(fileContent, /job title:?\s*([^\n]+)/i),
          employer: extractValue(fileContent, /employer:?\s*([^\n]+)/i),
          jobDescription: extractValue(fileContent, /description:?\s*([^\n]+)/i),
        },
        skills: {
          skills: extractList(fileContent, /skills:?\s*([^\n]+)/i),
          languages: extractList(fileContent, /languages:?\s*([^\n]+)/i),
        }
      };
    }

    // Clean up the uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Validate the parsed content
    if (!parsedContent || typeof parsedContent !== 'object') {
      throw new Error('Invalid response format from AI service');
    }

    res.json({
      success: true,
      data: parsedContent
    });
  } catch (error) {
    console.error('CV scanning error:', error);

    // Clean up the uploaded file in case of error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CV'
    });
  }
});

// Add new endpoint for image enhancement
app.post('/api/enhance-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Check if the file is an image
    if (!['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only JPG, JPEG, and PNG images are supported' });
    }

    // Read the image file
    const imageData = fs.readFileSync(filePath);
    const imageBase64 = Buffer.from(imageData).toString('base64');

    // Initialize Gemini AI model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Analyze image quality and enhance if needed
    const result = await model.generateContent([
      "Analyze this profile picture and enhance it if needed. Focus on:",
      "1. Improving lighting and contrast",
      "2. Reducing noise and blur",
      "3. Optimizing for professional appearance",
      "4. Maintaining natural skin tones",
      "Return the enhanced image as a base64 string.",
      {
        inlineData: {
          mimeType: `image/${fileExtension.slice(1)}`,
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    const enhancedImageBase64 = response.text();

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        enhancedImage: enhancedImageBase64
      }
    });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance image'
    });
  }
});

// Helper function to extract values from text
function extractValue(text: string, regex: RegExp): string {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Helper function to extract lists from text
function extractList(text: string, regex: RegExp): string[] {
  const match = text.match(regex);
  if (!match) return [];
  return match[1].split(',').map(item => item.trim());
}

// Type definitions for the API endpoints
interface JobCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

interface Company {
  id: number;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  size: string;
  website: string;
  foundedYear: number;
}

interface Job {
  id: number;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  type: string; // full-time, part-time, etc.
  category: string;
  description: string;
  requirements: string[];
  postedDate: string;
  isFeatured: boolean;
}

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get job categories
 *     description: Returns a list of job categories with counts
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of job categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: General Worker
 *                       slug:
 *                         type: string
 *                         example: general-worker
 *                       count:
 *                         type: integer
 *                         example: 245
 *                       icon:
 *                         type: string
 *                         example: user
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// API endpoint for job categories
app.get('/api/categories', (req, res) => {
  try {
    const categories: JobCategory[] = [
      { id: 1, name: 'General Worker', slug: 'general-worker', count: 245, icon: 'user' },
      { id: 2, name: 'Construction General Worker', slug: 'construction-worker', count: 178, icon: 'engineering' },
      { id: 3, name: 'Transnet General Worker', slug: 'transnet-worker', count: 56, icon: 'building' },
      { id: 4, name: 'Picker / Packer', slug: 'picker-packer', count: 132, icon: 'shopping-cart' },
      { id: 5, name: 'Warehouse Assistant', slug: 'warehouse', count: 98, icon: 'briefcase' },
      { id: 6, name: 'Cashier', slug: 'cashier', count: 167, icon: 'money' },
      { id: 7, name: 'Cleaner', slug: 'cleaner', count: 203, icon: 'broom' },
      { id: 8, name: 'Domestic Worker / Nanny', slug: 'domestic-worker', count: 185, icon: 'baby' },
      { id: 9, name: 'Security Guard / Officer', slug: 'security', count: 156, icon: 'shield' },
      { id: 10, name: 'Admin Clerk', slug: 'admin-clerk', count: 112, icon: 'office' },
      { id: 11, name: 'Receptionist', slug: 'receptionist', count: 87, icon: 'phone' },
      { id: 12, name: 'Data Capturer', slug: 'data-capturer', count: 76, icon: 'computer' },
      { id: 13, name: 'Waiter / Hospitality Staff', slug: 'hospitality', count: 143, icon: 'hotel' },
      { id: 14, name: 'Retail Assistant', slug: 'retail', count: 165, icon: 'shopping-cart' },
      { id: 15, name: 'Landscaper / Gardener', slug: 'landscaper', count: 92, icon: 'seedling' },
      { id: 16, name: 'Maintenance Assistant', slug: 'maintenance', count: 78, icon: 'engineering' },
      { id: 17, name: 'Driver', slug: 'driver', count: 189, icon: 'gas-pump' },
      { id: 18, name: 'Education Assistant', slug: 'education-assistant', count: 67, icon: 'school' },
      { id: 19, name: 'Call Centre Agent', slug: 'call-centre', count: 124, icon: 'phone' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve categories'
    });
  }
});

// API endpoint for featured jobs
app.get('/api/jobs/featured', (req, res) => {
  try {
    const featuredJobs: Job[] = [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'TechSA',
        companyLogo: 'https://via.placeholder.com/150',
        location: 'Cape Town, Western Cape',
        salary: 'R55,000 - R75,000',
        type: 'Full-time',
        category: 'Information Technology',
        description: 'We are looking for an experienced software engineer to join our team...',
        requirements: ['5+ years in software development', 'Experience with React and TypeScript', 'Bachelor\'s degree in Computer Science'],
        postedDate: '2025-04-20',
        isFeatured: true
      },
      {
        id: 2,
        title: 'Financial Analyst',
        company: 'Invest Group SA',
        companyLogo: 'https://via.placeholder.com/150',
        location: 'Johannesburg, Gauteng',
        salary: 'R40,000 - R50,000',
        type: 'Full-time',
        category: 'Finance & Accounting',
        description: 'Join our finance team to analyze market trends and financial data...',
        requirements: ['3+ years in financial analysis', 'CFA or equivalent', 'Advanced Excel skills'],
        postedDate: '2025-04-22',
        isFeatured: true
      },
      {
        id: 3,
        title: 'UX/UI Designer',
        company: 'CreativeSA',
        companyLogo: 'https://via.placeholder.com/150',
        location: 'Remote (South Africa)',
        salary: 'R35,000 - R45,000',
        type: 'Full-time',
        category: 'Design',
        description: 'Design intuitive user experiences for our digital products...',
        requirements: ['Portfolio showing UX process', 'Proficiency in Figma and Adobe Creative Suite', '2+ years experience'],
        postedDate: '2025-04-23',
        isFeatured: true
      },
      {
        id: 4,
        title: 'Sales Manager',
        company: 'GrowSA',
        companyLogo: 'https://via.placeholder.com/150',
        location: 'Durban, KwaZulu-Natal',
        salary: 'R45,000 - R60,000',
        type: 'Full-time',
        category: 'Sales & Marketing',
        description: 'Lead our sales team to achieve targets and expand our client base...',
        requirements: ['5+ years in sales management', 'Proven track record of exceeding targets', 'Experience in B2B sales'],
        postedDate: '2025-04-25',
        isFeatured: true
      }
    ];

    res.json({
      success: true,
      data: featuredJobs
    });
  } catch (error) {
    console.error('Featured jobs error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve featured jobs'
    });
  }
});

// API endpoint for companies
app.get('/api/companies', (req, res) => {
  try {
    const companies: Company[] = [
      {
        id: 1,
        name: 'TechSA',
        logo: 'https://via.placeholder.com/150',
        description: 'A leading tech company specializing in software development and digital transformation.',
        location: 'Cape Town, Western Cape',
        industry: 'Information Technology',
        size: '100-250 employees',
        website: 'https://techsa.co.za',
        foundedYear: 2010
      },
      {
        id: 2,
        name: 'Invest Group SA',
        logo: 'https://via.placeholder.com/150',
        description: 'A financial services firm providing investment management and financial advisory services.',
        location: 'Johannesburg, Gauteng',
        industry: 'Finance',
        size: '50-100 employees',
        website: 'https://investgroupsa.co.za',
        foundedYear: 2008
      },
      {
        id: 3,
        name: 'CreativeSA',
        logo: 'https://via.placeholder.com/150',
        description: 'A creative agency specializing in design, branding, and digital marketing.',
        location: 'Stellenbosch, Western Cape',
        industry: 'Design & Marketing',
        size: '10-50 employees',
        website: 'https://creativesa.co.za',
        foundedYear: 2015
      },
      {
        id: 4,
        name: 'GrowSA',
        logo: 'https://via.placeholder.com/150',
        description: 'A sales and distribution company focused on FMCG products throughout South Africa.',
        location: 'Durban, KwaZulu-Natal',
        industry: 'Sales & Distribution',
        size: '250-500 employees',
        website: 'https://growsa.co.za',
        foundedYear: 2005
      },
      {
        id: 5,
        name: 'HealthPlus',
        logo: 'https://via.placeholder.com/150',
        description: 'A healthcare provider operating clinics and medical facilities across South Africa.',
        location: 'Pretoria, Gauteng',
        industry: 'Healthcare',
        size: '500+ employees',
        website: 'https://healthplus.co.za',
        foundedYear: 2000
      }
    ];

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Companies error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve companies'
    });
  }
});

// File upload endpoints
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request (this would typically come from authentication)
    const userId = req.body.userId ? parseInt(req.body.userId) : null;
    const fileType = req.body.fileType || 'general';

    // Save the file using our file service
    const savedFile = await fileService.saveFile(req.file, userId, fileType);

    res.json({
      success: true,
      data: savedFile
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
});

// Upload profile image endpoint
app.post('/api/files/upload-profile-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request (this would typically come from authentication)
    const userId = req.body.userId ? parseInt(req.body.userId) : null;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Save the file using our file service
    const savedFile = await fileService.saveFile(req.file, userId, 'profile_image');

    res.json({
      success: true,
      data: {
        id: savedFile.id,
        fileUrl: savedFile.fileUrl
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload profile image'
    });
  }
});

// Upload CV endpoint
app.post('/api/files/upload-cv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request (this would typically come from authentication)
    const userId = req.body.userId ? parseInt(req.body.userId) : null;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Save the file using our file service
    const savedFile = await fileService.saveFile(req.file, userId, 'cv');

    res.json({
      success: true,
      data: {
        id: savedFile.id,
        fileUrl: savedFile.fileUrl
      }
    });
  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload CV'
    });
  }
});

// Get user files endpoint
app.get('/api/files/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const files = await fileService.getUserFiles(userId);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user files'
    });
  }
});

// Delete file endpoint
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const success = await fileService.deleteFile(fileId);

    res.json({
      success: true,
      data: { deleted: success }
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    });
  }
});

// Dashboard API endpoints
app.get('/api/dashboard/job-distribution', getJobDistribution);
app.get('/api/dashboard/job-recommendations', getJobRecommendations);
app.get('/api/dashboard/skills-analysis', getSkillsAnalysis);

// Use storage imported at the top of the file

// Create user endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, name, password } = req.body;

    if (!username || !email || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create user in database
    const user = await storage.createUser({
      username,
      email,
      name,
      password,
      notificationPreference: true
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
});

// Add 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Import WebSocket server
import WebSocketServer from '../websocket';

// Start server
const server = app.listen(port, () => {
  logger.info({
    message: `Server running on port ${port}`,
    port,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Initialize WebSocket server
const wss = new WebSocketServer(server);

// Example of sending updates (this would be triggered by real events in production)
// For demonstration purposes, we'll set up a simple interval to send updates
const sendMockUpdates = () => {
  // Get all users who should receive updates (in a real app, this would come from your database)
  const userIds = ['user1', 'user2', 'user3']; // Example user IDs

  // Send a random update to each user
  userIds.forEach(userId => {
    const updateType = Math.random() > 0.6 ? 'job' : Math.random() > 0.3 ? 'skill' : 'market';

    switch (updateType) {
      case 'job':
        wss.sendJobUpdate(userId, `New job matching your profile: ${Math.random().toString(36).substring(7)}`);
        break;
      case 'skill':
        wss.sendSkillUpdate(userId, `Skill demand increased: ${Math.random().toString(36).substring(7)}`);
        break;
      case 'market':
        wss.sendMarketUpdate(userId, `Market trend update: ${Math.random().toString(36).substring(7)}`);
        break;
    }
  });
};

// Send mock updates every 5 minutes (in a real app, this would be triggered by events)
const mockUpdateInterval = setInterval(sendMockUpdates, 5 * 60 * 1000);

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');

  // Clear intervals
  clearInterval(mockUpdateInterval);

  // Close WebSocket server
  wss.close();

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });
});
