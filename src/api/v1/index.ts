// src/api/v1/index.ts - Updated with rate limiting
import { Router } from 'express';
import { registerCategoryRoutes } from './routes/categories';
import { registerCompanyRoutes } from './routes/companies';
import { registerJobRoutes } from './routes/jobs';
import { registerUserRoutes } from './routes/users';
import { registerCVRoutes } from './routes/cv';
import { registerWiseUpRoutes } from './routes/wiseup';
import recommendationRoutes from '../../../server/recommendationRoutes';
import { authenticate } from '../../middleware/auth';
import { rateLimiters } from '../../middleware/rateLimit';

const v1Router = Router();

// Apply general rate limiting to all API routes
v1Router.use(rateLimiters.general);

// Public routes
registerCategoryRoutes(v1Router);
registerCompanyRoutes(v1Router);
registerJobRoutes(v1Router);

// Protected routes - require authentication
const protectedRouter = Router();
v1Router.use('/protected', authenticate, protectedRouter);

// Register protected routes
registerUserRoutes(protectedRouter);

// CV routes with AI rate limiting
const cvRouter = Router();
v1Router.use('/cv', authenticate, rateLimiters.ai, cvRouter);
registerCVRoutes(cvRouter);

// Mount recommendation routes with authentication and rate limiting
v1Router.use('/recommendations', authenticate, rateLimiters.strict, recommendationRoutes);

// WiseUp routes with mixed public and protected endpoints
const wiseUpRouter = Router();
v1Router.use('/wiseup', wiseUpRouter);
registerWiseUpRoutes(wiseUpRouter);

export default v1Router;
