import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { createInsertSchema } from 'drizzle-zod';
import { jobs, jobApplications, companies } from '@shared/schema';

const router = Router();

// Validation schemas
const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Job title is required'),
    description: z.string().min(1, 'Job description is required'),
    requirements: z.string().min(1, 'Job requirements are required'),
    location: z.string().min(1, 'Job location is required'),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    workMode: z.enum(['remote', 'hybrid', 'onsite']),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().default('ZAR'),
    categoryId: z.number().int().positive(),
    companyId: z.number().int().positive(),
    applicationDeadline: z.string().datetime().optional(),
    isActive: z.boolean().default(true),
  }),
});

const updateJobSchema = z.object({
  params: z.object({
    jobId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
      error: 'Job ID must be a valid number'
    }),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    requirements: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().optional(),
    categoryId: z.number().int().positive().optional(),
    applicationDeadline: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
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

const updateApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), {
      error: 'Application ID must be a valid number'
    }),
  }),
  body: z.object({
    status: z.enum(['applied', 'reviewed', 'interview', 'rejected', 'hired']),
    notes: z.string().optional(),
  }),
});

// Middleware to check if user is an employer
const requireEmployer = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      throw Errors.unauthorized('Authentication required');
    }

    // Check if user has employer role or is associated with a company
    const user = await storage.getUserByFirebaseId(req.user.uid);
    if (!user) {
      throw Errors.unauthorized('User not found');
    }

    // For now, we'll allow any authenticated user to access employer features
    // In a real app, you'd check for specific employer roles/permissions
    req.employerId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/employer/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - requirements
 *               - location
 *               - jobType
 *               - workMode
 *               - categoryId
 *               - companyId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: string
 *               location:
 *                 type: string
 *               jobType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship]
 *               workMode:
 *                 type: string
 *                 enum: [remote, hybrid, onsite]
 *               salaryMin:
 *                 type: number
 *               salaryMax:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: ZAR
 *               categoryId:
 *                 type: integer
 *               companyId:
 *                 type: integer
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/jobs', 
  verifyFirebaseToken, 
  requireEmployer, 
  validate(createJobSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const jobData = {
        ...req.body,
        postedBy: req.employerId,
        postedAt: new Date().toISOString(),
      };

      const job = await storage.createJob(jobData);
      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        job,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employer/jobs/{jobId}:
 *   put:
 *     summary: Update a job posting
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: string
 *               location:
 *                 type: string
 *               jobType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship]
 *               workMode:
 *                 type: string
 *                 enum: [remote, hybrid, onsite]
 *               salaryMin:
 *                 type: number
 *               salaryMax:
 *                 type: number
 *               currency:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.put('/jobs/:jobId', 
  verifyFirebaseToken, 
  requireEmployer, 
  validate(updateJobSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { jobId } = req.params;
      const updateData = req.body;

      const job = await storage.updateJob(jobId, updateData);
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      res.json({
        success: true,
        message: 'Job updated successfully',
        job,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employer/jobs/{jobId}:
 *   delete:
 *     summary: Delete a job posting
 *     tags: [Employer]
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
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.delete('/jobs/:jobId', 
  verifyFirebaseToken, 
  requireEmployer, 
  async (req: any, res: any, next: any) => {
    try {
      const { jobId } = req.params;

      const deleted = await storage.deleteJob(jobId);
      if (!deleted) {
        throw Errors.notFound('Job not found');
      }

      res.json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employer/applications:
 *   get:
 *     summary: Get job applications for employer's jobs
 *     tags: [Employer]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, reviewed, interview, rejected, hired]
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [appliedAt, updatedAt, status]
 *           default: appliedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/applications', 
  verifyFirebaseToken, 
  requireEmployer, 
  validate(getJobApplicationsSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { page, limit, status, jobId, sortBy, sortOrder } = req.query;

      // Get employer's jobs first
      const employerJobs = await storage.getJobsByEmployer(req.employerId);
      const jobIds = employerJobs.map(job => job.id);

      if (jobIds.length === 0) {
        return res.json({
          success: true,
          applications: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
          },
        });
      }

      const applications = await storage.getJobApplications({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        jobIds,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        applications: applications.data,
        pagination: applications.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employer/applications/{applicationId}:
 *   put:
 *     summary: Update application status
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [applied, reviewed, interview, rejected, hired]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 */
router.put('/applications/:applicationId', 
  verifyFirebaseToken, 
  requireEmployer, 
  validate(updateApplicationStatusSchema), 
  async (req: any, res: any, next: any) => {
    try {
      const { applicationId } = req.params;
      const { status, notes } = req.body;

      // Verify the application belongs to employer's job
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        throw Errors.notFound('Application not found');
      }

      const job = await storage.getJob(application.jobId);
      if (!job || job.postedBy !== req.employerId) {
        throw Errors.forbidden('You can only update applications for your own jobs');
      }

      const updatedApplication = await storage.updateJobApplication(applicationId, {
        status,
        notes,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Application status updated successfully',
        application: updatedApplication,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employer/dashboard:
 *   get:
 *     summary: Get employer dashboard data
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', 
  verifyFirebaseToken, 
  requireEmployer, 
  async (req: any, res: any, next: any) => {
    try {
      // Get employer's jobs
      const jobs = await storage.getJobsByEmployer(req.employerId);
      
      // Get applications for employer's jobs
      const jobIds = jobs.map(job => job.id);
      const applications = jobIds.length > 0 
        ? await storage.getJobApplications({ jobIds, limit: 1000 })
        : { data: [], pagination: { total: 0 } };

      // Calculate statistics
      const stats = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(job => job.isActive).length,
        totalApplications: applications.pagination.total,
        applicationsByStatus: {
          applied: applications.data.filter(app => app.status === 'applied').length,
          reviewed: applications.data.filter(app => app.status === 'reviewed').length,
          interview: applications.data.filter(app => app.status === 'interview').length,
          rejected: applications.data.filter(app => app.status === 'rejected').length,
          hired: applications.data.filter(app => app.status === 'hired').length,
        },
        recentApplications: applications.data.slice(0, 10),
        topJobs: jobs
          .map(job => ({
            ...job,
            applicationCount: applications.data.filter(app => app.jobId === job.id).length,
          }))
          .sort((a, b) => b.applicationCount - a.applicationCount)
          .slice(0, 5),
      };

      res.json({
        success: true,
        dashboard: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;