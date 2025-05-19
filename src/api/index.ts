// src/api/index.ts
import { Router } from 'express';
import v1Router from './v1';

const apiRouter = Router();

// Mount v1 API routes
apiRouter.use('/v1', v1Router);

export default apiRouter;
