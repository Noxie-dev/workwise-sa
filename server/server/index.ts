// server/server/index.ts - Updated to include Swagger documentation and WiseUp
import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { registerRoutes } from '../routes';
import v1Router from '../routes/v1';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { setupSwagger } from '../utils/swagger';
import { WiseUpService } from '../wiseup';
import { storage } from '../storage';
import { initializeDatabase } from '../db';
import { logger } from '../utils/logger';
import { secretManager } from '../services/secretManager';
import { cacheService } from '../services/cacheService';
import { authMonitoringService } from '../services/authMonitoringService';
import { initializeFirebaseServices, isFirebaseInitialized } from '../firebase';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function serveProductionStatic(app: Application) {
  const distPath = path.resolve(import.meta.dirname, 'public');
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the production frontend at ${distPath}`);
  }

  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

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
  await initializeDatabase();
  const databaseReady = true;
  await initializeFirebaseServices();

  // Initialize enhanced services
  await cacheService.initialize();
  await authMonitoringService.initialize();

  const app: Application = express();

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? (configuredOrigins.length > 0 ? configuredOrigins : false)
      : true,
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Middleware
  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', (_req, res) => {
    const firebaseReady = isFirebaseInitialized();
    const ready = databaseReady && firebaseReady;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      dependencies: {
        database: databaseReady,
        firebase: firebaseReady,
      },
    });
  });

  // Set up Swagger documentation
  setupSwagger(app as any);

  // Add a simple root route to prevent 500 errors
  app.get('/api', (_req, res) => {
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
  app.use('/api/v1', v1Router as unknown as Router);

  // For backward compatibility, register original routes
  const httpServer = await registerRoutes(app as any);

  // The production artifact contains both the API and the SPA. Mount the
  // static fallback only after API routes so /api/* can never be swallowed by
  // the client-side router.
  if (process.env.NODE_ENV === 'production') {
    serveProductionStatic(app);
  }

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
