// server/server/index.ts - Updated to include Swagger documentation and WiseUp
import express, { Application, Router } from 'express';
import cors from 'cors';
import { registerRoutes } from '../routes';
import apiRouter from '../../src/api';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { setupSwagger } from '../../src/api/swagger';
import { WiseUpService } from '../wiseup';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { secretManager } from '../services/secretManager';
import { cacheService } from '../services/cacheService';
import { authMonitoringService } from '../services/authMonitoringService';
import { initializeDatabase } from '../db';
import dotenv from 'dotenv';

dotenv.config();

console.log("PORT from .env:", process.env.PORT);
console.log("SESSION_SECRET from .env:", process.env.SESSION_SECRET);

async function preloadSecrets() {
  const secretKeys = [
    'ANTHROPIC_API_KEY',
    'GOOGLE_GENAI_API_KEY',
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'PORT',
    'SESSION_SECRET',
  ];
  for (const key of secretKeys) {
    await secretManager.getSecret(key);
  }
}

async function startServer() {
  await preloadSecrets();

  // Initialize database
  await initializeDatabase();

  // Initialize enhanced services
  await cacheService.initialize();
  await authMonitoringService.initialize();

  const app: Application = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware
  app.use(requestIdMiddleware);

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Set up Swagger documentation
  setupSwagger(app as any);

  // Add a simple root route to prevent 500 errors
  app.get('/', (req, res) => {
    res.json({ 
      message: 'WorkWise SA API Server', 
      version: '1.0.0',
      docs: '/api-docs',
      api: '/api'
    });
  });

  // Initialize database with sample data (skip in development with SQLite)
  if (process.env.NODE_ENV === 'production') {
    try {
      await storage.initializeData();
      logger.info("Database initialized with sample data");

      const wiseUpService = new WiseUpService();
      await wiseUpService.initializeData();
      logger.info("WiseUp service initialized with sample data");
    } catch (error) {
      logger.error("Error initializing data", { error });
    }
  } else {
    logger.info("Skipping data initialization in development mode");
  }

  // Mount versioned API routes
  app.use('/api', apiRouter as unknown as Router);

  // For backward compatibility, register original routes
  const httpServer = await registerRoutes(app as any);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = parseInt((await secretManager.getSecret('PORT')) || '3001');
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  logger.info("Shutting down gracefully...");
  await cacheService.shutdown();
  process.exit();
});

process.on('SIGTERM', async () => {
  logger.info("Shutting down gracefully...");
  await cacheService.shutdown();
  process.exit();
});

startServer().catch((err) => {
  logger.error("Failed to start server", { err });
  process.exit(1);
});
