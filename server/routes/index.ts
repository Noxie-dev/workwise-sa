import express from 'express';
import { Server } from 'http';
import aiRoutes from './aiRoutes';
import { storage } from '../storage';

export async function registerRoutes(app: express.Application): Promise<Server> {
  // Register AI routes
  app.use('/api/ai', aiRoutes);

  // Register storage routes
  app.use('/api/storage', storage.router);

  // Create and return the server instance
  const server = new Server(app);
  return server;
} 