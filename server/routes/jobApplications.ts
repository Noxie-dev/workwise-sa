import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/enhanced-auth';
import { Errors } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '@shared/auth-types';

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
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']).optional(),
    jobId: z.coerce.number().int().positive().optional(),
    sortBy: z.enum(['appliedAt', 'updatedAt', 'status']).default('appliedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
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
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']).optional(),
    sortBy: z.enum(['appliedAt', 'updatedAt', 'status']).default('appliedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// Apply for a job
router.post('/',
  authenticate,
  validate(createJobApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { jobId, coverLetter, resumeUrl, notes } = req.body;
      const userId = parseInt(req.user.id);

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
  authenticate,
  validate(getJobApplicationsSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { page, limit, status, jobId, sortBy, sortOrder } = req.query;
      const userId = parseInt(req.user.id);

      const applications = await storage.getJobApplicationsByUser(userId, {
        page: parseInt(String(page)) || 1,
        limit: parseInt(String(limit)) || 20,
        status: status as string | undefined,
        jobId: jobId ? parseInt(jobId as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        applications: applications.applications,
        pagination: {
          page,
          limit,
          total: applications.total,
          totalPages: Math.ceil(applications.total / (limit as number)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific job application
router.get('/:applicationId',
  authenticate,
  validate(getJobApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { applicationId } = req.params;
      const userId = parseInt(req.user.id);

      const application = await storage.getJobApplication(parseInt(applicationId));
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
  authenticate,
  validate(updateJobApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { applicationId } = req.params;
      const { status, notes } = req.body;
      const userId = parseInt(req.user.id);

      const application = await storage.getJobApplication(parseInt(applicationId));
      if (!application) {
        throw Errors.notFound('Job application not found');
      }

      // Check if user owns this application or is admin/employer
      // TODO: Implement proper role checking from Firebase custom claims
      if (application.userId !== userId) {
        throw Errors.forbidden('You can only update your own job applications');
      }

      const updatedApplication = await storage.updateJobApplication(parseInt(applicationId), {
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
  authenticate,
  validate(getJobApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { applicationId } = req.params;
      const userId = parseInt(req.user.id);

      const application = await storage.getJobApplication(parseInt(applicationId));
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

      await storage.deleteJobApplication(parseInt(applicationId));

      // Log withdrawal
      await storage.createUserInteraction({
        userId,
        interactionType: 'withdraw',
        jobId: application.jobId,
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
  authenticate,
  validate(getJobApplicationsByJobSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Errors.authentication('User authentication required'));
      }

      const { jobId } = req.params;
      const { page, limit, status, sortBy, sortOrder } = req.query;
      const userId = parseInt(req.user.id);

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

      const applications = await storage.getJobApplicationsByJob(parseInt(jobId), {
        page: parseInt(String(page)) || 1,
        limit: parseInt(String(limit)) || 20,
        status: status as string | undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        applications: applications.applications,
        pagination: {
          page,
          limit,
          total: applications.total,
          totalPages: Math.ceil(applications.total / (limit as number)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
