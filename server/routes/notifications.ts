import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const getNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    type: z.enum(['application', 'job', 'system', 'reminder']).optional(),
    isRead: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'type', 'isRead']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

const markAsReadSchema = z.object({
  params: z.object({
    notificationId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
      error: 'Notification ID must be a valid number'
    }),
  }),
});

const markAllAsReadSchema = z.object({
  body: z.object({
    type: z.enum(['application', 'job', 'system', 'reminder']).optional(),
  }).optional(),
});

const updateNotificationSettingsSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    applicationUpdates: z.boolean().optional(),
    jobRecommendations: z.boolean().optional(),
    systemAnnouncements: z.boolean().optional(),
    reminderNotifications: z.boolean().optional(),
  }),
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [application, job, system, reminder]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, type, isRead]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', 
  verifyFirebaseToken, 
  validate(getNotificationsSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const { page, limit, type, isRead, sortBy, sortOrder } = req.query;

      const notifications = await storage.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        isRead,
        sortBy,
        sortOrder,
      });

      // Get unread count
      const unreadCount = await storage.getUnreadNotificationCount(userId);

      res.json({
        success: true,
        notifications: notifications.data,
        pagination: notifications.pagination,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.put('/:notificationId/read', 
  verifyFirebaseToken, 
  validate(markAsReadSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await storage.markNotificationAsRead(notificationId, userId);
      if (!notification) {
        throw Errors.notFound('Notification not found');
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [application, job, system, reminder]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.put('/read-all', 
  verifyFirebaseToken, 
  validate(markAllAsReadSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const { type } = req.body;

      const updatedCount = await storage.markAllNotificationsAsRead(userId, type);

      res.json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        updatedCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', 
  verifyFirebaseToken, 
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;

      const settings = await storage.getNotificationSettings(userId);

      res.json({
        success: true,
        settings: settings || {
          emailNotifications: true,
          pushNotifications: true,
          applicationUpdates: true,
          jobRecommendations: true,
          systemAnnouncements: true,
          reminderNotifications: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/notifications/settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               applicationUpdates:
 *                 type: boolean
 *               jobRecommendations:
 *                 type: boolean
 *               systemAnnouncements:
 *                 type: boolean
 *               reminderNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', 
  verifyFirebaseToken, 
  validate(updateNotificationSettingsSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const settings = req.body;

      const updatedSettings = await storage.updateNotificationSettings(userId, settings);

      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        settings: updatedSettings,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.delete('/:notificationId', 
  verifyFirebaseToken, 
  validate(markAsReadSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const deleted = await storage.deleteNotification(notificationId, userId);
      if (!deleted) {
        throw Errors.notFound('Notification not found');
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;