// server/server/index.ts - Updated to include Swagger documentation and WiseUp
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../routes';
import apiRouter from '../../src/api';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { setupSwagger } from '../../src/api/swagger';
import { WiseUpService } from '../wiseup';
import { storage } from '../storage';
import { logger } from '../utils/logger';
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

  logger.info('Preloading secrets...');
  for (const key of secretKeys) {
    try {
      const secret = await secretManager.getSecret(key);
      if (secret) {
        logger.info(`Secret loaded: ${key}`);
      } else {
        logger.warn(`Secret not found: ${key} (using default or null)`);
      }
    } catch (error) {
      logger.error(`Error loading secret: ${key}`, { error });
    }
  }
}

import helmet from 'helmet';
import { runMigrations } from '../migrations';

async function startServer() {
  try {
    logger.info('Starting server initialization');
    await preloadSecrets();

    // Run database migrations
    if (process.env.AUTO_RUN_MIGRATIONS === 'true') {
      logger.info('Running database migrations');
      await runMigrations();
    }

    // Initialize database connection
    const { initializeDatabase } = await import('../db');
    await initializeDatabase();

    // Initialize Firebase services
    const { initializeFirebaseServices, isFirebaseInitialized } = await import('../firebase');
    await initializeFirebaseServices();
    
    if (!isFirebaseInitialized()) {
      logger.warn('Firebase services are using mock implementations - some features may not work correctly');
    }

    const app = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestIdMiddleware);

    // Serve uploaded files statically
    app.use('/uploads', express.static('uploads'));

    // Set up Swagger documentation
    setupSwagger(app);
    
    // Initialize database with sample data (skip in development with SQLite)
    if (process.env.NODE_ENV === 'production') {
      try {
        await storage.initializeData();
        logger.info("Database initialized with sample data");

        // Initialize WiseUp service with sample data
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
    app.use('/api', apiRouter);

    // For backward compatibility, register original routes
    // These will be deprecated in future versions
    const httpServer = await registerRoutes(app);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    const PORT = parseInt(await secretManager.getSecret('PORT') || '5000');
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { port: PORT });
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    });

    return httpServer;
  } catch (error) {
    logger.error('Failed to start server', { error });
    throw error;
  }
}

startServer().catch(console.error);

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason, 
    promise: promise.toString(),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  // In production, we might want to attempt graceful shutdown or restart
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Continuing execution after unhandled rejection in production');
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // Always exit on uncaught exceptions to avoid undefined state
  logger.warn('Process will exit due to uncaught exception');
  
  // Allow time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
