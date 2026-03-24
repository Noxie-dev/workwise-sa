import type { Express } from "express";
import { createServer, type Server } from "http";
import recommendationRoutes from "./recommendationRoutes";
import fileRoutes from "./routes/files";
import profileRoutes from "./routes/profile";
import scrapingRoutes from "./routes/scraping";
import dashboardRoutes from "./routes/dashboard";
import employerRoutes from "./routes/employer";
import adminAnalyticsRoutes from "./routes/adminAnalytics";
import jobApplicationRoutes from "./routes/jobApplications";
import monetizationRoutes from "./routes/monetization";
import notificationChannelRoutes from "./routes/notificationChannels";
import { registerCvApiRoutes } from "./routes/cvApi";
import { registerPublicApiRoutes } from "./routes/publicApi";

export async function registerRoutes(app: Express): Promise<Server> {
  registerPublicApiRoutes(app);
  registerCvApiRoutes(app);

  // Register job recommendation routes
  app.use('/api/recommendations', recommendationRoutes);
  
  // Register file upload routes
  app.use('/api/files', fileRoutes);

  // Register monetization scaffolding routes
  app.use('/api/monetization', monetizationRoutes);

  // Register dashboard and employer/admin analytics routes
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/employer', employerRoutes);
  app.use('/api/admin/analytics', adminAnalyticsRoutes);
  
  // Register profile routes
  app.use('/api/profile', profileRoutes);

  // Register notification channel scaffolding routes
  app.use('/api/notifications/channels', notificationChannelRoutes);

  // Register job application routes
  app.use('/api/job-applications', jobApplicationRoutes);

  // Register scraping orchestration routes
  app.use('/api/scraping', scrapingRoutes);
  
  const httpServer = createServer(app);
  return httpServer;
}
