import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const searchCandidatesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    location: z.string().optional(),
    availability: z.enum(['immediate', 'weeks', 'months', 'not_available']).optional(),
    salaryMin: z.coerce.number().optional(),
    salaryMax: z.coerce.number().optional(),
    educationLevel: z.enum(['none', 'matric', 'certificate', 'diploma', 'degree', 'postgraduate']).optional(),
    remote: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    sortBy: z.enum(['relevance', 'updated', 'created', 'name']).default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
});

const getCandidateSchema = z.object({
  params: z.object({
    candidateId: z.string().uuid(),
  })
});

const saveCandidateSchema = z.object({
  params: z.object({
    candidateId: z.string().uuid(),
  }),
  body: z.object({
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional(),
  })
});

const contactCandidateSchema = z.object({
  params: z.object({
    candidateId: z.string().uuid(),
  }),
  body: z.object({
    subject: z.string().min(1).max(200),
    message: z.string().min(10).max(2000),
    jobId: z.string().uuid().optional(),
  })
});

const reportCandidateSchema = z.object({
  params: z.object({
    candidateId: z.string().uuid(),
  }),
  body: z.object({
    reason: z.enum(['spam', 'inappropriate', 'fake', 'other']),
    description: z.string().min(10).max(500).optional(),
  })
});

const getCandidateRecommendationsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
    skills: z.array(z.string()).optional(),
    limit: z.coerce.number().min(1).max(20).default(10),
  })
});

// Search and Browse Routes
router.get('/search', 
  authenticate,
  rateLimiter(100, 60), // 100 requests per minute
  validate(searchCandidatesSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const params = req.query;

      // Check if user has active subscription or credits
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription && (!credits || credits.creditsRemaining <= 0)) {
        throw Errors.forbidden('Active subscription or credits required to search candidates');
      }

      // Build search filters
      const filters = {
        search: params.search,
        skills: params.skills,
        experience: params.experience,
        location: params.location,
        availability: params.availability,
        salaryRange: params.salaryMin || params.salaryMax ? {
          min: params.salaryMin,
          max: params.salaryMax,
        } : undefined,
        educationLevel: params.educationLevel,
        remote: params.remote === 'true',
        isActive: true,
        isVerified: true,
      };

      // Execute search
      const results = await storage.searchCandidates(filters, {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      // Log search for analytics
      await storage.createSearchLog({
        userId,
        type: 'candidate_search',
        query: params.search,
        filters: JSON.stringify(filters),
        resultsCount: results.total,
      });

      res.json({
        candidates: results.candidates,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: results.total,
          totalPages: Math.ceil(results.total / params.limit),
        },
        filters: filters,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/browse',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      // Check subscription/credits
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription && (!credits || credits.creditsRemaining <= 0)) {
        throw Errors.forbidden('Active subscription or credits required to browse candidates');
      }

      // Get recently active candidates
      const candidates = await storage.getRecentCandidates({
        page: Number(page),
        limit: Number(limit),
        maxAge: 30, // days
      });

      res.json({
        candidates: candidates.candidates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: candidates.total,
          totalPages: Math.ceil(candidates.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Individual Candidate Routes
router.get('/:candidateId',
  authenticate,
  rateLimiter(200, 60), // 200 requests per minute
  validate(getCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;

      // Check subscription/credits
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription && (!credits || credits.creditsRemaining <= 0)) {
        throw Errors.forbidden('Active subscription or credits required to view candidate profiles');
      }

      const candidate = await storage.getCandidateProfile(candidateId);
      if (!candidate) {
        throw Errors.notFound('Candidate not found');
      }

      if (!candidate.isActive || !candidate.isVerified) {
        throw Errors.notFound('Candidate not available');
      }

      // Check if candidate is already saved by this user
      const savedCandidate = await storage.getSavedCandidate(userId, candidateId);
      const isSaved = !!savedCandidate;

      // Log profile view
      await storage.createProfileView({
        viewerId: userId,
        candidateId,
        viewedAt: new Date(),
      });

      // Increment profile views for candidate
      await storage.incrementCandidateViews(candidateId);

      res.json({
        candidate: {
          ...candidate,
          isSaved,
          savedData: savedCandidate ? {
            notes: savedCandidate.notes,
            tags: savedCandidate.tags,
            rating: savedCandidate.rating,
            savedAt: savedCandidate.savedAt,
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:candidateId/cv',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(getCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;

      // Check subscription/credits and deduct credit if needed
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription) {
        if (!credits || credits.creditsRemaining <= 0) {
          throw Errors.forbidden('Active subscription or credits required to view CVs');
        }
        
        // Deduct credit for CV access
        await storage.deductJobCredit(userId, 1, 'cv_access');
      }

      const candidate = await storage.getCandidateProfile(candidateId);
      if (!candidate) {
        throw Errors.notFound('Candidate not found');
      }

      if (!candidate.cvFileUrl) {
        throw Errors.notFound('CV not available for this candidate');
      }

      // Log CV access
      await storage.createCvAccess({
        userId,
        candidateId,
        accessedAt: new Date(),
      });

      res.json({
        cvUrl: candidate.cvFileUrl,
        cvFileName: candidate.cvFileName,
        candidateName: candidate.name,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Saved Candidates Routes
router.post('/:candidateId/save',
  authenticate,
  rateLimiter(100, 60), // 100 requests per minute
  validate(saveCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;
      const { notes, tags, rating } = req.body;

      // Verify candidate exists
      const candidate = await storage.getCandidateProfile(candidateId);
      if (!candidate) {
        throw Errors.notFound('Candidate not found');
      }

      // Check if already saved
      const existingSaved = await storage.getSavedCandidate(userId, candidateId);
      
      if (existingSaved) {
        // Update existing saved candidate
        await storage.updateSavedCandidate(existingSaved.id, {
          notes,
          tags,
          rating,
          updatedAt: new Date(),
        });
      } else {
        // Create new saved candidate
        await storage.createSavedCandidate({
          userId,
          candidateId,
          notes,
          tags,
          rating,
        });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:candidateId/save',
  authenticate,
  rateLimiter(100, 60), // 100 requests per minute
  validate(getCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;

      const savedCandidate = await storage.getSavedCandidate(userId, candidateId);
      if (!savedCandidate) {
        throw Errors.notFound('Saved candidate not found');
      }

      await storage.deleteSavedCandidate(savedCandidate.id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/saved/list',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, sortBy = 'savedAt', sortOrder = 'desc' } = req.query;

      const savedCandidates = await storage.getSavedCandidates(userId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        candidates: savedCandidates.candidates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: savedCandidates.total,
          totalPages: Math.ceil(savedCandidates.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Contact Candidate Routes
router.post('/:candidateId/contact',
  authenticate,
  rateLimiter(20, 60), // 20 requests per minute
  validate(contactCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;
      const { subject, message, jobId } = req.body;

      // Check subscription/credits and deduct credit if needed
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription) {
        if (!credits || credits.creditsRemaining <= 0) {
          throw Errors.forbidden('Active subscription or credits required to contact candidates');
        }
        
        // Deduct credit for contact
        await storage.deductJobCredit(userId, 1, 'candidate_contact');
      }

      // Verify candidate exists
      const candidate = await storage.getCandidateProfile(candidateId);
      if (!candidate) {
        throw Errors.notFound('Candidate not found');
      }

      // Get user/company info
      const user = await storage.getUser(userId);
      const company = user.companyId ? await storage.getCompany(user.companyId) : null;

      // Create contact record
      const contact = await storage.createCandidateContact({
        candidateId,
        userId,
        subject,
        message,
        jobId,
        contactedAt: new Date(),
      });

      // Send notification email to candidate
      await storage.sendEmail({
        to: candidate.email,
        subject: `New message from ${company?.name || user.name}`,
        template: 'candidate_contact',
        data: {
          candidateName: candidate.name,
          companyName: company?.name || user.name,
          senderName: user.name,
          subject,
          message,
          jobId,
          contactId: contact.id,
        },
      });

      res.json({ success: true, contactId: contact.id });
    } catch (error) {
      next(error);
    }
  }
);

// Report Candidate Routes
router.post('/:candidateId/report',
  authenticate,
  rateLimiter(10, 60), // 10 requests per minute
  validate(reportCandidateSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { candidateId } = req.params;
      const { reason, description } = req.body;

      // Verify candidate exists
      const candidate = await storage.getCandidateProfile(candidateId);
      if (!candidate) {
        throw Errors.notFound('Candidate not found');
      }

      // Check if user has already reported this candidate
      const existingReport = await storage.getCandidateReport(userId, candidateId);
      if (existingReport) {
        throw Errors.validation('You have already reported this candidate');
      }

      // Create report
      await storage.createCandidateReport({
        candidateId,
        reporterId: userId,
        reason,
        description,
        reportedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Recommendations Routes
router.get('/recommendations/similar',
  authenticate,
  rateLimiter(50, 60), // 50 requests per minute
  validate(getCandidateRecommendationsSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { jobId, skills, limit } = req.query;

      // Check subscription/credits
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserJobCredits(userId);
      
      if (!subscription && (!credits || credits.creditsRemaining <= 0)) {
        throw Errors.forbidden('Active subscription or credits required to get recommendations');
      }

      let recommendationParams;
      
      if (jobId) {
        // Get recommendations based on job requirements
        const job = await storage.getJob(jobId);
        if (!job || job.userId !== userId) {
          throw Errors.notFound('Job not found');
        }
        
        recommendationParams = {
          skills: job.skills,
          experience: job.experienceLevel,
          location: job.location,
          salaryRange: job.salaryRange,
        };
      } else if (skills) {
        // Get recommendations based on provided skills
        recommendationParams = { skills };
      } else {
        // Get recommendations based on user's recent activity
        const recentSearches = await storage.getRecentSearches(userId, 5);
        const recentJobs = await storage.getUserJobs(userId, { limit: 5 });
        
        recommendationParams = {
          skills: [
            ...recentSearches.flatMap(s => s.skills || []),
            ...recentJobs.jobs.flatMap(j => j.skills || []),
          ],
        };
      }

      const recommendations = await storage.getCandidateRecommendations(
        userId,
        recommendationParams,
        Number(limit)
      );

      res.json({
        recommendations: recommendations.candidates,
        total: recommendations.total,
        basedOn: jobId ? 'job' : skills ? 'skills' : 'activity',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Analytics Routes
router.get('/analytics/searches',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const analytics = await storage.getCandidateSearchAnalytics(userId, period as string);

      res.json({
        analytics: {
          totalSearches: analytics.totalSearches,
          topSkills: analytics.topSkills,
          topLocations: analytics.topLocations,
          searchTrends: analytics.searchTrends,
          averageResultsPerSearch: analytics.averageResultsPerSearch,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
