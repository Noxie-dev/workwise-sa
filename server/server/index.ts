// server/server/index.ts - Updated to include Swagger documentation and WiseUp
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../routes';
import apiRouter from '../../src/api';
import { errorHandler, notFoundHandler, requestIdMiddleware } from '../middleware/errorHandler';
import { setupSwagger } from '../../src/api/swagger';
import { WiseUpService } from '../wiseup';
import { storage } from '../storage';

async function main() {
  const app = express();

  // Middleware
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
  await registerRoutes(app);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API documentation available at http://localhost:${port}/api-docs`);
  });

  return server;
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;
