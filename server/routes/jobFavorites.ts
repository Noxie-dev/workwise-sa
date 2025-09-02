import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const toggleFavoriteSchema = z.object({
  params: z.object({
    jobId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
        error: 'Job ID must be a valid number'
    }),
  })
});

const getFavoritesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
    sortBy: z.enum(['createdAt', 'jobTitle', 'company', 'salary']).prefault('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).prefault('desc'),
  })
});

// Get user's favorite jobs
router.get('/favorites',
  authenticate,
  validate(getFavoritesSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page, limit, sortBy, sortOrder } = req.query;

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
router.get('/:jobId/favorite',
  authenticate,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      // Verify job exists
      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      const isFavorited = await storage.isJobFavorited(userId, parseInt(jobId));

      res.json({
        isFavorited,
        jobId: parseInt(jobId),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add job to favorites
router.post('/:jobId/favorite',
  authenticate,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      // Verify job exists
      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      // Check if already favorited
      const isAlreadyFavorited = await storage.isJobFavorited(userId, parseInt(jobId));
      if (isAlreadyFavorited) {
        return res.json({
          success: true,
          message: 'Job is already in favorites',
          isFavorited: true,
        });
      }

      // Add to favorites
      await storage.addJobToFavorites(userId, parseInt(jobId));

      // Log activity
      await storage.createUserInteraction({
        userId,
        interactionType: 'favorite',
        jobId: parseInt(jobId),
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
router.delete('/:jobId/favorite',
  authenticate,
  validate(toggleFavoriteSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      // Check if favorited
      const isFavorited = await storage.isJobFavorited(userId, parseInt(jobId));
      if (!isFavorited) {
        return res.json({
          success: true,
          message: 'Job was not in favorites',
          isFavorited: false,
        });
      }

      // Remove from favorites
      await storage.removeJobFromFavorites(userId, parseInt(jobId));

      // Log activity
      await storage.createUserInteraction({
        userId,
        interactionType: 'unfavorite',
        jobId: parseInt(jobId),
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
router.get('/favorites/count',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUserFavoriteJobsCount(userId);

      res.json({
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
