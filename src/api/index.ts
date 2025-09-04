// src/api/index.ts
import { Router } from 'express';
import v1Router from './v1';
import { registerCategoryRoutes } from './v1/routes/categories';
import { registerCompanyRoutes } from './v1/routes/companies';
import { registerJobRoutes } from './v1/routes/jobs';
import { registerUserRoutes } from './v1/routes/users';

const apiRouter = Router();

// Mount v1 API routes
apiRouter.use('/v1', v1Router);

// Backward compatibility routes - direct API access
const compatibilityRouter = Router();
registerCategoryRoutes(compatibilityRouter);
registerCompanyRoutes(compatibilityRouter);
registerJobRoutes(compatibilityRouter);
registerUserRoutes(compatibilityRouter);

// Mount compatibility routes directly under /api
apiRouter.use('/', compatibilityRouter);

export default apiRouter;
