import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const getNotificationsSchema = z.object({
  query: z.object({
    type: z.enum(['all', 'job_alerts', 'applications', 'messages', 'system']).optional(),
    read: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
    sortBy: z.enum(['createdAt', 'priority']).prefault('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).prefault('desc'),
  })
});

const markNotificationReadSchema = z.object({
  params: z.object({
    notificationId: z.uuid(),
  })
});

const createJobAlertSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    keywords: z.array(z.string()).optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    remote: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).prefault('weekly'),
    isActive: z.boolean().prefault(true),
  })
});

const updateJobAlertSchema = z.object({
  params: z.object({
    alertId: z.uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    keywords: z.array(z.string()).optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    remote: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    isActive: z.boolean().optional(),
  })
});

const sendEmailSchema = z.object({
  body: z.object({
    to: z.email(),
    subject: z.string().min(1).max(200),
    template: z.string().optional(),
    content: z.string().optional(),
    data: z.record(z.string(), z.any()).optional(),
    priority: z.enum(['low', 'normal', 'high']).prefault('normal'),
  })
});

const createMessageSchema = z.object({
  body: z.object({
    recipientId: z.uuid(),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    jobId: z.uuid().optional(),
    applicationId: z.uuid().optional(),
    priority: z.enum(['low', 'normal', 'high']).prefault('normal'),
  })
});

const updateNotificationSettingsSchema = z.object({
  body: z.object({
    emailNotifications: z.object({
      jobAlerts: z.boolean().optional(),
      applications: z.boolean().optional(),
      messages: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
      marketing: z.boolean().optional(),
    }).optional(),
    pushNotifications: z.object({
      jobAlerts: z.boolean().optional(),
      applications: z.boolean().optional(),
      messages: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
    }).optional(),
    smsNotifications: z.object({
      jobAlerts: z.boolean().optional(),
      applications: z.boolean().optional(),
      messages: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
    }).optional(),
    frequency: z.object({
      jobAlerts: z.enum(['immediate', 'daily', 'weekly']).optional(),
      digest: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }).optional(),
  })
});

// Notification Management Routes
router.get('/',
  authenticate,
  rateLimiter(200, 60), // 200 requests per minute
  validate(getNotificationsSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { type, read, page, limit, sortBy, sortOrder } = req.query;

      const filters = {
        userId,
        type: type !== 'all' ? type : undefined,
        read: read ? read === 'true' : undefined,
      };

      const notifications = await storage.getNotifications(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.json({
        notifications: notifications.notifications,
        pagination: {
          page,
          limit,
          total: notifications.total,
          totalPages: Math.ceil(notifications.total / limit),
        },
        unreadCount: notifications.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:notificationId/read',
  authenticate,
  rateLimiter(100, 60), // 100 requests per minute
  validate(markNotificationReadSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        throw Errors.notFound('Notification not found');
      }

      if (notification.userId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      await storage.markNotificationRead(notificationId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/mark-all-read',
  authenticate,
  rateLimiter(20, 60), // 20 requests per minute
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { type } = req.body;

      await storage.markAllNotificationsRead(userId, type);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:notificationId',
  authenticate,
  rateLimiter(100, 60), // 100 requests per minute
  validate(markNotificationReadSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        throw Errors.notFound('Notification not found');
      }

      if (notification.userId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      await storage.deleteNotification(notificationId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Job Alert Management Routes
router.get('/job-alerts',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const jobAlerts = await storage.getJobAlerts(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        jobAlerts: jobAlerts.alerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: jobAlerts.total,
          totalPages: Math.ceil(jobAlerts.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/job-alerts',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(createJobAlertSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const alertData = req.body;

      // Check if user has reached the limit of job alerts
      const existingAlerts = await storage.getJobAlerts(userId);
      const maxAlerts = req.user.isPremium ? 20 : 5;
      
      if (existingAlerts.total >= maxAlerts) {
        throw Errors.forbidden(`Maximum of ${maxAlerts} job alerts allowed`);
      }

      const jobAlert = await storage.createJobAlert({
        userId,
        ...alertData,
      });

      res.json({
        jobAlert,
        message: 'Job alert created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/job-alerts/:alertId',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(updateJobAlertSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { alertId } = req.params;
      const updateData = req.body;

      const jobAlert = await storage.getJobAlert(alertId);
      if (!jobAlert) {
        throw Errors.notFound('Job alert not found');
      }

      if (jobAlert.userId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      const updatedJobAlert = await storage.updateJobAlert(alertId, updateData);

      res.json({
        jobAlert: updatedJobAlert,
        message: 'Job alert updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/job-alerts/:alertId',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(updateJobAlertSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { alertId } = req.params;

      const jobAlert = await storage.getJobAlert(alertId);
      if (!jobAlert) {
        throw Errors.notFound('Job alert not found');
      }

      if (jobAlert.userId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      await storage.deleteJobAlert(alertId);

      res.json({
        success: true,
        message: 'Job alert deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/job-alerts/:alertId/test',
  authenticate,
  rateLimiter(10, 60), // 10 requests per minute
  validate(updateJobAlertSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { alertId } = req.params;

      const jobAlert = await storage.getJobAlert(alertId);
      if (!jobAlert) {
        throw Errors.notFound('Job alert not found');
      }

      if (jobAlert.userId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      // Get matching jobs for the alert
      const matchingJobs = await storage.getJobsForAlert(jobAlert, 5);

      res.json({
        jobAlert: {
          name: jobAlert.name,
          criteria: jobAlert.criteria,
        },
        matchingJobs: matchingJobs.jobs,
        totalMatches: matchingJobs.total,
        message: `Found ${matchingJobs.total} matching jobs`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Email Management Routes
router.post('/send-email',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(sendEmailSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { to, subject, template, content, data, priority } = req.body;

      // Check if user has permission to send emails
      const user = await storage.getUser(userId);
      if (!user.isEmailVerified) {
        throw Errors.forbidden('Email must be verified to send emails');
      }

      // Rate limiting for email sending
      const emailsSentToday = await storage.getEmailsSentToday(userId);
      const maxEmailsPerDay = req.user.isPremium ? 100 : 10;
      
      if (emailsSentToday >= maxEmailsPerDay) {
        throw Errors.forbidden(`Daily email limit of ${maxEmailsPerDay} reached`);
      }

      let emailContent;
      if (template) {
        // Use template with data
        emailContent = await storage.renderEmailTemplate(template, data || {});
      } else {
        // Use provided content
        emailContent = content;
      }

      const emailId = await storage.sendEmail({
        from: user.email,
        to,
        subject,
        html: emailContent,
        priority,
        userId,
      });

      res.json({
        success: true,
        emailId,
        message: 'Email sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/email-history',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const emailHistory = await storage.getEmailHistory(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.json({
        emails: emailHistory.emails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: emailHistory.total,
          totalPages: Math.ceil(emailHistory.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Internal Messaging Routes
router.get('/messages',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type = 'all' } = req.query;

      const messages = await storage.getMessages(userId, {
        page: Number(page),
        limit: Number(limit),
        type: type as string,
      });

      res.json({
        messages: messages.messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: messages.total,
          totalPages: Math.ceil(messages.total / Number(limit)),
        },
        unreadCount: messages.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/messages',
  authenticate,
  rateLimiter(30, 60), // 30 requests per minute
  validate(createMessageSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { recipientId, subject, message, jobId, applicationId, priority } = req.body;

      // Verify recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        throw Errors.notFound('Recipient not found');
      }

      // Check if messaging is allowed between users
      const canMessage = await storage.canMessageUser(userId, recipientId);
      if (!canMessage) {
        throw Errors.forbidden('Cannot send message to this user');
      }

      const newMessage = await storage.createMessage({
        senderId: userId,
        recipientId,
        subject,
        message,
        jobId,
        applicationId,
        priority,
      });

      // Send notification to recipient
      await storage.createNotification({
        userId: recipientId,
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${req.user.name}`,
        data: {
          messageId: newMessage.id,
          senderId: userId,
          senderName: req.user.name,
          subject,
        },
      });

      res.json({
        message: newMessage,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/messages/:messageId',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await storage.getMessage(messageId);
      if (!message) {
        throw Errors.notFound('Message not found');
      }

      if (message.senderId !== userId && message.recipientId !== userId) {
        throw Errors.forbidden('Access denied');
      }

      // Mark as read if recipient is viewing
      if (message.recipientId === userId && !message.readAt) {
        await storage.markMessageRead(messageId);
      }

      res.json({ message });
    } catch (error) {
      next(error);
    }
  }
);

// Notification Settings Routes
router.get('/settings',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const settings = await storage.getNotificationSettings(userId);

      res.json({
        settings: settings || {
          emailNotifications: {
            jobAlerts: true,
            applications: true,
            messages: true,
            systemUpdates: true,
            marketing: false,
          },
          pushNotifications: {
            jobAlerts: true,
            applications: true,
            messages: true,
            systemUpdates: true,
          },
          smsNotifications: {
            jobAlerts: false,
            applications: false,
            messages: false,
            systemUpdates: false,
          },
          frequency: {
            jobAlerts: 'immediate',
            digest: 'weekly',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/settings',
  authenticate,
  rateLimiter(20, 60), // 20 requests per minute
  validate(updateNotificationSettingsSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const settingsData = req.body;

      const updatedSettings = await storage.updateNotificationSettings(userId, settingsData);

      res.json({
        settings: updatedSettings,
        message: 'Notification settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Email Templates Routes
router.get('/email-templates',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Check if user has admin privileges
      const user = await storage.getUser(userId);
      if (!user.isAdmin) {
        throw Errors.forbidden('Admin access required');
      }

      const templates = await storage.getEmailTemplates();

      res.json({
        templates,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Analytics Routes
router.get('/analytics',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const analytics = await storage.getNotificationAnalytics(userId, period as string);

      res.json({
        analytics: {
          totalNotifications: analytics.totalNotifications,
          notificationsByType: analytics.notificationsByType,
          readRate: analytics.readRate,
          emailsSent: analytics.emailsSent,
          emailDeliveryRate: analytics.emailDeliveryRate,
          jobAlertPerformance: analytics.jobAlertPerformance,
          messageActivity: analytics.messageActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
