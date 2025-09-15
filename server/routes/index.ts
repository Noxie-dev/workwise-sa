import express from 'express';
import { Server } from 'http';
import aiRoutes from './aiRoutes';
import authMonitoringRoutes from './authMonitoring';
import jobApplicationsRoutes from './jobApplications';
import paymentsRoutes from './payments';
import employerRoutes from './employer';
import favoritesRoutes from './favorites';
import notificationsRoutes from './notifications';
import { storage } from '../storage';

export async function registerRoutes(app: express.Application): Promise<Server> {
  // Register AI routes
  app.use('/api/ai', aiRoutes);

  // Register authentication monitoring routes
  app.use('/api/auth-monitoring', authMonitoringRoutes);

  // Register job applications routes
  app.use('/api/job-applications', jobApplicationsRoutes);

  // Register payments routes
  app.use('/api/payments', paymentsRoutes);

  // Register employer routes
  app.use('/api/employer', employerRoutes);

  // Register favorites routes
  app.use('/api/favorites', favoritesRoutes);

  // Register notifications routes
  app.use('/api/notifications', notificationsRoutes);

  // Register storage routes
  app.use('/api/storage', storage.router);

  // Create and return the server instance
  const server = new Server(app);
  return server;
}