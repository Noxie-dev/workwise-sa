// server/server/index.ts - Updated to include Swagger documentation and WiseUp
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../routes';
import apiRouter from '../../src/api';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { setupSwagger } from '../../src/api/swagger';
import { WiseUpService } from '../wiseup';
import { storage } from '../storage';

import { secretManager } from '../services/secretManager';

async function preloadSecrets() {
  const secretKeys = [
    'ANTHROPIC_API_KEY',
    'GOOGLE_GENAI_API_KEY',
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'UPLOAD_DIR',
    'FILE_SERVE_URL',
    'PORT'
  ];

  for (const key of secretKeys) {
    await secretManager.getSecret(key);
  }
}

import helmet from 'helmet';

// ... (imports)

async function startServer() {
  await preloadSecrets();

  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Set up Swagger documentation
  setupSwagger(app);
  // Initialize database with sample data
  try {
    await storage.initializeData();
    console.log("Database initialized with sample data");

    // Initialize WiseUp service with sample data
    const wiseUpService = new WiseUpService();
    await wiseUpService.initializeData();
    console.log("WiseUp service initialized with sample data");
  } catch (error) {
    console.error("Error initializing data:", error);
  }

  // Mount versioned API routes
  app.use('/api', apiRouter);

  // For backward compatibility, register original routes
  // These will be deprecated in future versions
  const httpServer = await registerRoutes(app);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = await secretManager.getSecret('PORT') || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
  });

  return httpServer;
}

startServer().catch(console.error);
