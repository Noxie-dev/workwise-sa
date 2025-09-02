import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const toggleFavoriteSchema = z.object({
  params: z.object({
    jobId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
      error: 'Job ID must be a valid number'
    }),
  }),
});

const getFavoritesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    sortBy: z.enum(['addedAt', 'title', 'company']).default('addedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

/**
 * @swagger
 * /api/favorites/jobs/{jobId}:
 *   post:
 *     summary: Add job to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job added to favorites successfully
 *       400:
 *         description: Job already in favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.post('/jobs/:jobId', 
  verifyFirebaseToken, 
  validate(toggleFavoriteSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      // Check if already favorited
      const existingFavorite = await storage.getJobFavorite(userId, jobId);
      if (existingFavorite) {
        return res.status(400).json({
          success: false,
          message: 'Job already in favorites',
        });
      }

      // Add to favorites
      const favorite = await storage.addJobFavorite(userId, jobId);
      
      res.json({
        success: true,
        message: 'Job added to favorites',
        favorite,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/favorites/jobs/{jobId}:
 *   delete:
 *     summary: Remove job from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job removed from favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 */
router.delete('/jobs/:jobId', 
  verifyFirebaseToken, 
  validate(toggleFavoriteSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Check if favorite exists
      const favorite = await storage.getJobFavorite(userId, jobId);
      if (!favorite) {
        throw Errors.notFound('Favorite not found');
      }

      // Remove from favorites
      await storage.removeJobFavorite(userId, jobId);
      
      res.json({
        success: true,
        message: 'Job removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/favorites/jobs:
 *   get:
 *     summary: Get user's favorite jobs
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [addedAt, title, company]
 *           default: addedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Favorite jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/jobs', 
  verifyFirebaseToken, 
  validate(getFavoritesSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const { page, limit, sortBy, sortOrder } = req.query;

      const favorites = await storage.getUserJobFavorites(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        favorites: favorites.data,
        pagination: favorites.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/favorites/jobs/{jobId}/status:
 *   get:
 *     summary: Check if job is favorited
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/jobs/:jobId/status', 
  verifyFirebaseToken, 
  validate(toggleFavoriteSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const favorite = await storage.getJobFavorite(userId, jobId);
      
      res.json({
        success: true,
        isFavorited: !!favorite,
        favorite,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;