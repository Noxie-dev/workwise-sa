import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

const router = Router();

// Validation schemas
const toggleFavoriteSchema = z.object({
  params: z.object({
    jobId: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val), {
        error: 'Job ID must be a valid number',
      }),
  }),
});

const getFavoritesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
    sortBy: z.enum(['createdAt', 'jobTitle', 'company', 'salary']).prefault('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).prefault('desc'),
  }),
});

// Get user's favorite jobs
router.get(
  '/favorites',
  verifyFirebaseToken,
  validate(getFavoritesSchema),
  async (req, res, next) => {
    try {
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const userId = dbUser.id;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const favorites = await storage.getUserFavoriteJobs(userId, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.json({
        jobs: favorites.jobs,
        pagination: {
          page,
          limit,
          total: favorites.total,
          totalPages: Math.ceil(favorites.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Check if job is favorited by user
router.get(
  '/:jobId/favorite',
  verifyFirebaseToken,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const userId = dbUser.id;
      const jobId = Number((req.params as { jobId: string }).jobId);

      // Verify job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      const isFavorited = await storage.isJobFavorited(userId, jobId);

      res.json({
        isFavorited,
        jobId,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add job to favorites
router.post(
  '/:jobId/favorite',
  verifyFirebaseToken,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const userId = dbUser.id;
      const jobId = Number((req.params as { jobId: string }).jobId);

      // Verify job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      // Check if already favorited
      const isAlreadyFavorited = await storage.isJobFavorited(userId, jobId);
      if (isAlreadyFavorited) {
        return res.json({
          success: true,
          message: 'Job is already in favorites',
          isFavorited: true,
        });
      }

      // Add to favorites
      await storage.addJobToFavorites(userId, jobId);

      // Log activity
      await storage.createUserInteraction({
        userId,
        interactionType: 'favorite',
        jobId,
        interactionTime: new Date(),
        metadata: { action: 'add' },
      });

      res.json({
        success: true,
        message: 'Job added to favorites',
        isFavorited: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove job from favorites
router.delete(
  '/:jobId/favorite',
  verifyFirebaseToken,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const userId = dbUser.id;
      const jobId = Number((req.params as { jobId: string }).jobId);

      // Check if favorited
      const isFavorited = await storage.isJobFavorited(userId, jobId);
      if (!isFavorited) {
        return res.json({
          success: true,
          message: 'Job was not in favorites',
          isFavorited: false,
        });
      }

      // Remove from favorites
      await storage.removeJobFromFavorites(userId, jobId);

      // Log activity
      await storage.createUserInteraction({
        userId,
        interactionType: 'unfavorite',
        jobId,
        interactionTime: new Date(),
        metadata: { action: 'remove' },
      });

      res.json({
        success: true,
        message: 'Job removed from favorites',
        isFavorited: false,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get favorite jobs count
router.get('/favorites/count', verifyFirebaseToken, async (req, res, next) => {
  try {
    const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
    const userId = dbUser.id;
    const count = await storage.getUserFavoriteJobsCount(userId);

    res.json({
      count,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
