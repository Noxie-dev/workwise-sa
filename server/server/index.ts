import express from "express";
import cors from "cors";
import { registerRoutes } from "../routes";
import { storage } from "../storage";
import apiRouter from "../../src/api";
import errorHandler from "../middleware/errorHandler";

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Initialize database with sample data
  try {
    await storage.initializeData();
    console.log("Database initialized with sample data");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
  
  // API routes
  app.use('/api', apiRouter);
  
  // Register legacy routes
  const httpServer = await registerRoutes(app);
  
  // Error handling middleware
  app.use(errorHandler);
  
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  return httpServer;
}

startServer().catch(console.error);
