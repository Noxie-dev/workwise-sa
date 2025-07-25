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

  console.log('⚙️  Preloading secrets...');
  for (const key of secretKeys) {
    try {
      const secret = await secretManager.getSecret(key);
      if (secret) {
        console.log(`✅ ${key}: loaded`);
      } else {
        console.log(`⚠️  ${key}: not found (using default or null)`);
      }
    } catch (error) {
      console.error(`❌ ${key}: error loading - ${error}`);
    }
  }
}

import helmet from 'helmet';

// ... (imports)

async function startServer() {
  await preloadSecrets();

  // Initialize database connection first
  const { initializeDatabase } = await import('../db');
  await initializeDatabase();

  // Initialize Firebase services
  const { initializeFirebaseServices } = await import('../firebase');
  await initializeFirebaseServices();

  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Set up Swagger documentation
  setupSwagger(app);
  // Initialize database with sample data (skip in development with SQLite)
  if (process.env.NODE_ENV === 'production') {
    try {
      await storage.initializeData();
      console.log("✅ Database initialized with sample data");

      // Initialize WiseUp service with sample data
      const wiseUpService = new WiseUpService();
      await wiseUpService.initializeData();
      console.log("✅ WiseUp service initialized with sample data");
    } catch (error) {
      console.error("❌ Error initializing data:", error);
    }
  } else {
    console.log("⚠️  Skipping data initialization in development mode");
  }

  // Mount versioned API routes
  app.use('/api', apiRouter);

  // For backward compatibility, register original routes
  // These will be deprecated in future versions
  const httpServer = await registerRoutes(app);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = parseInt(await secretManager.getSecret('PORT') || '5000');
  httpServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 API documentation available at http://localhost:${PORT}/api-docs`);
  });

  return httpServer;
}

startServer().catch(console.error);

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, cleanup, or crash reporting
  // In a real application, you might want to gracefully shut down or restart
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, cleanup, or crash reporting
  // In a real application, you might want to gracefully shut down or restart
  process.exit(1); // Exit the process to avoid undefined state
});
