import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { createInsertSchema } from 'drizzle-zod';
import { jobApplications } from '@shared/schema';

const router = Router();

// Validation schemas
const createJobApplicationSchema = z.object({
  body: z.object({
    jobId: z.int().positive(),
    coverLetter: z.string().optional(),
    resumeUrl: z.url().optional(),
    notes: z.string().optional(),
  }),
});

const updateJobApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
        error: 'Application ID must be a valid number'
    }),
  }),
  body: z.object({
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']).optional(),
    notes: z.string().optional(),
  }),
});

const getJobApplicationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']).optional(),
    jobId: z.coerce.number().int().positive().optional(),
    sortBy: z.enum(['appliedAt', 'updatedAt', 'status']).prefault('appliedAt'),
    sortOrder: z.enum(['asc', 'desc']).prefault('desc'),
  }),
});

const getJobApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
        error: 'Application ID must be a valid number'
    }),
  }),
});

const getJobApplicationsByJobSchema = z.object({
  params: z.object({
    jobId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
        error: 'Job ID must be a valid number'
    }),
  }),
  query: z.object({
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']).optional(),
    sortBy: z.enum(['appliedAt', 'updatedAt', 'status']).prefault('appliedAt'),
    sortOrder: z.enum(['asc', 'desc']).prefault('desc'),
  }),
});

// Apply for a job
router.post('/',
  verifyFirebaseToken,
  validate(createJobApplicationSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { jobId, coverLetter, resumeUrl, notes } = req.body;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      // Check if user has already applied for this job
      const existingApplication = await storage.getJobApplicationByUserAndJob(userId, jobId);
      if (existingApplication) {
        throw Errors.conflict('You have already applied for this job');
      }

      // Create job application
      const application = await storage.createJobApplication({
        userId,
        jobId,
        coverLetter,
        resumeUrl,
        notes,
        status: 'applied',
      });

      // Log user interaction
      await storage.createUserInteraction({
        userId,
        interactionType: 'apply',
        jobId,
        interactionTime: new Date(),
        metadata: { applicationId: application.id },
      });

      res.status(201).json({
        success: true,
        message: 'Job application submitted successfully',
        application,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's job applications
router.get('/',
  verifyFirebaseToken,
  validate(getJobApplicationsSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { page, limit, status, jobId, sortBy, sortOrder } = req.query;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      const applications = await storage.getJobApplicationsByUser(userId, {
        page,
        limit,
        status,
        jobId,
        sortBy,
        sortOrder,
      });

      res.json({
        applications: applications.applications,
        pagination: {
          page,
          limit,
          total: applications.total,
          totalPages: Math.ceil(applications.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific job application
router.get('/:applicationId',
  verifyFirebaseToken,
  validate(getJobApplicationSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { applicationId } = req.params;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        throw Errors.notFound('Job application not found');
      }

      // Check if user owns this application or is admin
      // TODO: Implement proper role checking from Firebase custom claims
      if (application.userId !== userId) {
        throw Errors.forbidden('You can only view your own job applications');
      }

      res.json({ application });
    } catch (error) {
      next(error);
    }
  }
);

// Update job application (usually for employers to update status)
router.put('/:applicationId',
  verifyFirebaseToken,
  validate(updateJobApplicationSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { applicationId } = req.params;
      const { status, notes } = req.body;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        throw Errors.notFound('Job application not found');
      }

      // Check if user owns this application or is admin/employer
      // TODO: Implement proper role checking from Firebase custom claims
      if (application.userId !== userId) {
        throw Errors.forbidden('You can only update your own job applications');
      }

      const updatedApplication = await storage.updateJobApplication(applicationId, {
        status,
        notes,
        updatedAt: new Date(),
      });

      // Log status change if status was updated
      if (status && status !== application.status) {
        await storage.createUserInteraction({
          userId: application.userId,
          interactionType: 'status_update',
          jobId: application.jobId,
          interactionTime: new Date(),
          metadata: { 
            applicationId: application.id,
            oldStatus: application.status,
            newStatus: status,
          },
        });

        // Create notification for user about status change
        await storage.createUserNotification({
          userId: application.userId,
          type: 'application_status_update',
          content: `Your application status has been updated to: ${status}`,
          jobId: application.jobId,
          isRead: false,
        });
      }

      res.json({
        success: true,
        message: 'Job application updated successfully',
        application: updatedApplication,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete job application (withdraw application)
router.delete('/:applicationId',
  verifyFirebaseToken,
  validate(getJobApplicationSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { applicationId } = req.params;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        throw Errors.notFound('Job application not found');
      }

      // Check if user owns this application
      if (application.userId !== userId) {
        throw Errors.forbidden('You can only withdraw your own job applications');
      }

      // Only allow withdrawal if application is in 'applied' or 'reviewed' status
      if (!['applied', 'reviewed'].includes(application.status)) {
        throw Errors.validation('Cannot withdraw application in current status');
      }

      await storage.deleteJobApplication(applicationId);

      // Log withdrawal
      await storage.createUserInteraction({
        userId,
        interactionType: 'withdraw',
        jobId: application.jobId,
        interactionTime: new Date(),
        metadata: { applicationId: application.id },
      });

      res.json({
        success: true,
        message: 'Job application withdrawn successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get applications for a specific job (for employers)
router.get('/job/:jobId',
  verifyFirebaseToken,
  validate(getJobApplicationsByJobSchema),
  async (req, res, next) => {
    try {
      const user = (req as any).user;
      const { jobId } = req.params;
      const { page, limit, status, sortBy, sortOrder } = req.query;

      if (!user || !user.uid) {
        throw Errors.authentication('User authentication required');
      }

      // For now, use a placeholder userId since we need to map Firebase UID to database user ID
      const userId = 1; // TODO: Implement proper user mapping

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      // Check if user has permission to view applications for this job
      // This would typically check if user is the job poster or admin
      // TODO: Implement proper role checking from Firebase custom claims
      // For now, allow any authenticated user to view job applications
      // if (user.role !== 'admin' && user.role !== 'employer') {
      //   throw Errors.forbidden('You do not have permission to view job applications');
      // }

      const applications = await storage.getJobApplicationsByJob(jobId, {
        page,
        limit,
        status,
        sortBy,
        sortOrder,
      });

      res.json({
        applications: applications.applications,
        pagination: {
          page,
          limit,
          total: applications.total,
          totalPages: Math.ceil(applications.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
