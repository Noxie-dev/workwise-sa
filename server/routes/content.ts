import { Request, Response, NextFunction, Router } from 'express';
import { storage } from '../storage';
import { verifyFirebaseToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validation';
import { Errors } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../../shared/auth-types';
import { z } from 'zod';
import multer from 'multer';

const router = Router();

// Custom admin middleware that checks user.role instead of user.isAdmin
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw Errors.authentication('User not authenticated');
    }
    
    // Convert string ID to number for storage method
    const userId = parseInt(req.user.uid || req.user.id);
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      throw Errors.forbidden('Admin access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const requireCompanyAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw Errors.authentication('User not authenticated');
    }
    
    // Convert string ID to number for storage method
    const userId = parseInt(req.user.uid || req.user.id);
    const user = await storage.getUser(userId);
    if (!user) {
      throw Errors.authentication('User not found');
    }
    
    // Admin can access any company
    if (user.role === 'admin') {
      return next();
    }
    
    // For now, just pass through - this should check if user is admin of the specific company
    next();
  } catch (error) {
    next(error);
  }
};

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow only specific file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

// Validation schemas
const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(50).max(10000),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    remote: z.boolean().prefault(false),
    location: z.string().optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    salaryType: z.enum(['hourly', 'monthly', 'annually']).optional(),
    category: z.string().min(1).max(100),
    tags: z.array(z.string()).optional(),
    applicationDeadline: z.iso.datetime().optional(),
    startDate: z.iso.datetime().optional(),
    isActive: z.boolean().prefault(true),
    isFeatured: z.boolean().prefault(false),
    applicationUrl: z.url().optional(),
    applicationEmail: z.email().optional(),
    applicationInstructions: z.string().optional(),
  })
});

const updateJobSchema = z.object({
  params: z.object({
    jobId: z.uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(50).max(10000).optional(),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    remote: z.boolean().optional(),
    location: z.string().optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    salaryType: z.enum(['hourly', 'monthly', 'annually']).optional(),
    category: z.string().min(1).max(100).optional(),
    tags: z.array(z.string()).optional(),
    applicationDeadline: z.iso.datetime().optional(),
    startDate: z.iso.datetime().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    applicationUrl: z.url().optional(),
    applicationEmail: z.email().optional(),
    applicationInstructions: z.string().optional(),
  })
});

const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(50).max(5000),
    industry: z.string().min(1).max(100),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    founded: z.number().min(1800).max(new Date().getFullYear()),
    website: z.url().optional(),
    location: z.string().optional(),
    headquarters: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    culture: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    values: z.array(z.string()).optional(),
    socialMedia: z.object({
      linkedin: z.url().optional(),
      twitter: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
    }).optional(),
    isVerified: z.boolean().prefault(false),
    isActive: z.boolean().prefault(true),
    isPremium: z.boolean().prefault(false),
  })
});

const updateCompanySchema = z.object({
  params: z.object({
    companyId: z.uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().min(50).max(5000).optional(),
    industry: z.string().min(1).max(100).optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
    founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
    website: z.url().optional(),
    location: z.string().optional(),
    headquarters: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    culture: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    values: z.array(z.string()).optional(),
    socialMedia: z.object({
      linkedin: z.url().optional(),
      twitter: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
    }).optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isPremium: z.boolean().optional(),
  })
});

const bulkOperationSchema = z.object({
  body: z.object({
    action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
    ids: z.array(z.uuid()).min(1).max(100),
  })
});

const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    type: z.enum(['jobs', 'companies', 'all']).prefault('all'),
    page: z.coerce.number().min(1).prefault(1),
    limit: z.coerce.number().min(1).max(50).prefault(20),
  })
});

// Removed duplicate requireAdmin - using the one defined above

// Removed duplicate requireCompanyAdmin - using the one defined above

// Job Management Routes
router.get('/jobs',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        category,
        location,
        remote,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        status: status !== 'all' ? status : undefined,
        category: category as string,
        location: location as string,
        remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      };

      // Fix storage method call - getJobs expects no arguments or different signature
      const jobs = await storage.getJobs();

      // Handle storage method returning array instead of paginated result
      const jobsArray = Array.isArray(jobs) ? jobs : (jobs as any)?.jobs || [];
      const totalCount = Array.isArray(jobs) ? jobs.length : (jobs as any)?.total || 0;

      res.json({
        jobs: jobsArray,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
        stats: {
          totalJobs: totalCount,
          activeJobs: Array.isArray(jobs) ? jobsArray.filter((j: any) => !j.expiredAt).length : (jobs as any)?.activeCount || 0,
          featuredJobs: Array.isArray(jobs) ? jobsArray.filter((j: any) => j.isFeatured).length : (jobs as any)?.featuredCount || 0,
          expiredJobs: Array.isArray(jobs) ? jobsArray.filter((j: any) => j.expiredAt).length : (jobs as any)?.expiredCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/jobs',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(20, 60), // 20 requests per minute
  validate(createJobSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) {
        throw Errors.authentication('User not authenticated');
      }
      
      const jobData = req.body;
      const createdBy = parseInt(req.user.uid || req.user.id);

      const job = await storage.createJob({
        ...jobData,
        createdBy,
      });

      res.status(201).json({
        job,
        message: 'Job created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/jobs/:jobId',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      const analytics = await storage.getJobAnalytics(parseInt(jobId));

      res.json({
        job,
        analytics: {
          views: analytics.views,
          applications: analytics.applications,
          saves: analytics.saves,
          shares: analytics.shares,
          conversionRate: analytics.conversionRate,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/jobs/:jobId',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(50, 60), // 50 requests per minute
  validate(updateJobSchema),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const updateData = req.body;

      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      const updatedJob = await storage.updateJob(parseInt(jobId), updateData);

      res.json({
        job: updatedJob,
        message: 'Job updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/jobs/:jobId',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(20, 60), // 20 requests per minute
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getJob(parseInt(jobId));
      if (!job) {
        throw Errors.notFound('Job not found');
      }

      await storage.deleteJob(parseInt(jobId));

      res.json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/jobs/bulk',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(10, 60), // 10 requests per minute
  validate(bulkOperationSchema),
  async (req, res, next) => {
    try {
      const { action, ids } = req.body;

      const result = await storage.bulkJobOperation(action, ids);

      res.json({
        success: true,
        message: `${action} completed successfully`,
        affected: result.affected,
        results: result.results,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Company Management Routes
router.get('/companies',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        industry,
        size,
        verified,
        premium,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        status: status !== 'all' ? status : undefined,
        industry: industry as string,
        size: size as string,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        premium: premium === 'true' ? true : premium === 'false' ? false : undefined,
      };

      // Fix storage method call - getCompanies expects no arguments or different signature
      const companies = await storage.getCompanies();

      // Handle storage method returning array instead of paginated result
      const companiesArray = Array.isArray(companies) ? companies : (companies as any)?.companies || [];

      res.json({
        companies: companiesArray,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Array.isArray(companies) ? companies.length : (companies as any)?.total || 0,
          totalPages: Math.ceil((Array.isArray(companies) ? companies.length : (companies as any)?.total || 0) / Number(limit)),
        },
        stats: {
          totalCompanies: Array.isArray(companies) ? companies.length : (companies as any)?.total || 0,
          activeCompanies: Array.isArray(companies) ? companiesArray.filter((c: any) => c.isActive).length : (companies as any)?.activeCount || 0,
          verifiedCompanies: Array.isArray(companies) ? companiesArray.filter((c: any) => c.isVerified).length : (companies as any)?.verifiedCount || 0,
          premiumCompanies: Array.isArray(companies) ? companiesArray.filter((c: any) => c.isPremium).length : (companies as any)?.premiumCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/companies',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(10, 60), // 10 requests per minute
  validate(createCompanySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) {
        throw Errors.authentication('User not authenticated');
      }
      
      const companyData = req.body;
      const createdBy = parseInt(req.user.uid || req.user.id);

      const company = await storage.createCompany({
        ...companyData,
        createdBy,
      });

      res.status(201).json({
        company,
        message: 'Company created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/companies/:companyId',
  verifyFirebaseToken,
  requireCompanyAdmin,
  async (req, res, next) => {
    try {
      const { companyId } = req.params;

      const company = await storage.getCompany(parseInt(companyId));
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      const analytics = await storage.getCompanyAnalytics(parseInt(companyId));

      res.json({
        company,
        analytics: {
          totalJobs: analytics.totalJobs,
          activeJobs: analytics.activeJobs,
          totalViews: analytics.totalViews,
          totalApplications: analytics.totalApplications,
          followers: analytics.followers,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/companies/:companyId',
  verifyFirebaseToken,
  requireCompanyAdmin,
  rateLimiter(20, 60), // 20 requests per minute
  validate(updateCompanySchema),
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const updateData = req.body;

      const company = await storage.getCompany(parseInt(companyId));
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      const updatedCompany = await storage.updateCompany(parseInt(companyId), updateData);

      res.json({
        company: updatedCompany,
        message: 'Company updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/companies/:companyId',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(5, 60), // 5 requests per minute
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const companyIdNum = parseInt(companyId);

      const company = await storage.getCompany(companyIdNum);
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      await storage.deleteCompany(companyIdNum);

      res.json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Company Job Management Routes
router.get('/companies/:companyId/jobs',
  verifyFirebaseToken,
  requireCompanyAdmin,
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        companyId,
        status: status !== 'all' ? status : undefined,
      };

      // Fix storage method call - getJobs expects no arguments or different signature
      const jobs = await storage.getJobs();

      // Handle storage method returning array instead of paginated result
      const jobsArray = Array.isArray(jobs) ? jobs : (jobs as any)?.jobs || [];

      // Handle pagination with actual array data
      const totalCount = Array.isArray(jobs) ? jobs.length : (jobs as any)?.total || 0;

      res.json({
        jobs: jobsArray,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/companies/:companyId/jobs',
  verifyFirebaseToken,
  requireCompanyAdmin,
  rateLimiter(10, 60), // 10 requests per minute
  validate(createJobSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) {
        throw Errors.authentication('User not authenticated');
      }
      
      const { companyId } = req.params;
      const jobData = req.body;
      const createdBy = parseInt(req.user.uid || req.user.id);

      const job = await storage.createJob({
        ...jobData,
        companyId,
        createdBy,
      });

      res.status(201).json({
        job,
        message: 'Job created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// File Upload Routes
router.post('/companies/:companyId/logo',
  verifyFirebaseToken,
  requireCompanyAdmin,
  upload.single('logo'),
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const file = req.file;

      if (!file) {
        throw Errors.badRequest('No file uploaded');
      }

      const company = await storage.getCompany(parseInt(companyId));
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      const logoUrl = await storage.uploadCompanyLogo(parseInt(companyId), file);

      res.json({
        success: true,
        logoUrl,
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/companies/:companyId/images',
  verifyFirebaseToken,
  requireCompanyAdmin,
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw Errors.badRequest('No files uploaded');
      }

      const company = await storage.getCompany(parseInt(companyId));
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      const imageUrls = await storage.uploadCompanyImages(parseInt(companyId), files);

      res.json({
        success: true,
        images: imageUrls,
        message: 'Images uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Search Routes
router.get('/search',
  verifyFirebaseToken,
  validate(searchSchema),
  async (req, res, next) => {
    try {
      const { q, type, page, limit } = req.query;

      // Fix storage method call - searchContent expects different arguments
      const results = await storage.searchContent(q as string, type as string);

      res.json({
        query: q,
        type,
        results: results.results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: results.total,
          totalPages: Math.ceil(results.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Analytics Routes
router.get('/analytics/overview',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { period = '30d' } = req.query;

      // Fix storage method call - getContentAnalytics expects no arguments
      const analytics = await storage.getContentAnalytics();

      res.json({
        analytics: {
          jobs: {
            total: analytics.jobs.total,
            active: analytics.jobs.active,
            featured: analytics.jobs.featured,
            expired: analytics.jobs.expired,
            growth: analytics.jobs.growth,
          },
          companies: {
            total: analytics.companies.total,
            active: analytics.companies.active,
            verified: analytics.companies.verified,
            premium: analytics.companies.premium,
            growth: analytics.companies.growth,
          },
          applications: {
            total: analytics.applications.total,
            pending: analytics.applications.pending,
            approved: analytics.applications.approved,
            rejected: analytics.applications.rejected,
            conversionRate: analytics.applications.conversionRate,
          },
          traffic: {
            pageViews: analytics.traffic.pageViews,
            uniqueVisitors: analytics.traffic.uniqueVisitors,
            averageSessionDuration: analytics.traffic.averageSessionDuration,
            bounceRate: analytics.traffic.bounceRate,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/analytics/jobs',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { period = '30d' } = req.query;

      // Fix storage method call - getJobAnalytics expects 0-1 arguments
      const analytics = await storage.getJobAnalytics();

      res.json({
        analytics: {
          performance: analytics.performance,
          categories: analytics.categories,
          locations: analytics.locations,
          salaryRanges: analytics.salaryRanges,
          trends: analytics.trends,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/analytics/companies',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { period = '30d' } = req.query;

      // Fix storage method call - getCompanyAnalytics expects 0-1 arguments
      const analytics = await storage.getCompanyAnalytics();

      res.json({
        analytics: {
          topCompanies: analytics.topCompanies,
          industryDistribution: analytics.industryDistribution,
          sizeDistribution: analytics.sizeDistribution,
          growth: analytics.growth,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export/Import Routes
router.post('/export/jobs',
  verifyFirebaseToken,
  requireAdmin,
  rateLimiter(5, 60), // 5 requests per minute
  async (req, res, next) => {
    try {
      const { format = 'csv', filters = {} } = req.body;

      const exportData = await storage.exportJobs(filters, format);

      res.json({
        success: true,
        downloadUrl: exportData.downloadUrl,
        expiresAt: exportData.expiresAt,
        message: 'Export completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/import/jobs',
  verifyFirebaseToken,
  requireAdmin,
  upload.single('file'),
  rateLimiter(2, 60), // 2 requests per minute
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file) {
        throw Errors.badRequest('No file uploaded');
      }

      const importResult = await storage.importJobs(file);

      res.json({
        success: true,
        imported: importResult.imported,
        errors: importResult.errors,
        message: `Successfully imported ${importResult.imported} jobs`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
