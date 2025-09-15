// src/api/v1/index.ts
import { Router } from 'express';
import { registerCategoryRoutes } from './routes/categories';
import { registerCompanyRoutes } from './routes/companies';
import { registerJobRoutes } from './routes/jobs';
import { registerUserRoutes } from './routes/users';

const v1Router = Router();

// Register all route handlers
registerCategoryRoutes(v1Router);
registerCompanyRoutes(v1Router);
registerJobRoutes(v1Router);
registerUserRoutes(v1Router);

export default v1Router;
