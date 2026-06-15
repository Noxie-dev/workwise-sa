import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { Errors } from '../middleware/errorHandler';
import { type AuthenticatedRequest, verifyFirebaseToken } from '../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

const router = Router();

async function resolveProfileTarget(userIdParam: string) {
  const numericId = parseInt(userIdParam, 10);
  if (!Number.isNaN(numericId)) {
    return {
      numericId,
      profile: await storage.getUserProfile(numericId),
    };
  }

  const user = await storage.getUserByFirebaseUid(userIdParam);
  return {
    numericId: user?.id,
    profile: user ? await storage.getUserProfile(user.id) : null,
  };
}

async function assertProfileAccess(req: AuthenticatedRequest, userIdParam: string) {
  const authUser = await resolveAuthenticatedDatabaseUser(req.user!);
  const target = await resolveProfileTarget(userIdParam);

  if (!target.numericId || !target.profile) {
    throw Errors.notFound('Profile not found');
  }

  if (authUser.id !== target.numericId && authUser.role !== 'admin') {
    throw Errors.forbidden('You can only access your own profile');
  }

  return target;
}

router.use(verifyFirebaseToken);

// Validation schemas
const updateProfileSchema = z.object({
  body: z.object({
    personal: z
      .object({
        fullName: z.string().optional(),
        phoneNumber: z.string().optional(),
        location: z.string().optional(),
        idNumber: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        bio: z.string().optional(),
        profilePicture: z.string().optional(),
        professionalImage: z.string().optional(),
      })
      .optional(),
    education: z
      .object({
        highestEducation: z.string().optional(),
        schoolName: z.string().optional(),
        yearCompleted: z.string().optional(),
        achievements: z.string().optional(),
        additionalCourses: z.string().optional(),
      })
      .optional(),
    experience: z
      .object({
        hasExperience: z.boolean().optional(),
        currentlyEmployed: z.boolean().optional(),
        jobTitle: z.string().optional(),
        employer: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        jobDescription: z.string().optional(),
        previousExperience: z.string().optional(),
        volunteerWork: z.string().optional(),
        references: z.string().optional(),
      })
      .optional(),
    skills: z
      .object({
        skills: z.array(z.string()).optional(),
        customSkills: z.string().optional(),
        languages: z.array(z.string()).optional(),
        hasDriversLicense: z.boolean().optional(),
        hasTransport: z.boolean().optional(),
        cvUpload: z.string().optional(),
      })
      .optional(),
    preferences: z
      .object({
        jobTypes: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
        minSalary: z.number().optional(),
        willingToRelocate: z.boolean().optional(),
      })
      .optional(),
  }),
});

const scanCVSchema = z.object({
  body: z.object({
    enhancedScan: z.boolean().optional(),
  }),
});

const enhanceImageSchema = z.object({
  body: z.object({
    imageData: z.string(),
  }),
});

const processAIPromptSchema = z.object({
  body: z.object({
    prompt: z.string(),
    cvData: z.any(),
    warnings: z.array(z.any()).optional(),
  }),
});

/**
 * Get user profile
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { profile } = await assertProfileAccess(req as AuthenticatedRequest, req.params.userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 */
router.put('/:userId', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { numericId } = await assertProfileAccess(req as AuthenticatedRequest, req.params.userId);

    const profileData = req.body;

    const updatedProfile = await storage.updateUserProfile(numericId!, profileData);

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Scan CV to extract profile information
 */
router.post('/scan-cv', async (req, res, next) => {
  try {
    // This endpoint would be called by the frontend with file data
    // Implementation would use AI service to extract information

    res.json({
      success: true,
      data: {
        extractedData: {
          personal: {
            fullName: 'Sample Name',
            phoneNumber: '123456789',
            location: 'Sample Location',
          },
          education: {
            highestEducation: 'Degree',
            schoolName: 'Sample University',
          },
          experience: {
            jobTitle: 'Sample Job',
            employer: 'Sample Company',
          },
          skills: {
            skills: ['Sample Skill 1', 'Sample Skill 2'],
          },
        },
        warnings: [],
        confidence: [
          { section: 'personal', confidence: 0.9 },
          { section: 'education', confidence: 0.8 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Enhance profile image
 */
router.post('/enhance-image', async (req, res, next) => {
  try {
    // This would integrate with AI service for image enhancement

    res.json({
      success: true,
      data: {
        enhancedImage: 'base64_enhanced_image_data',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Process AI prompt for profile improvements
 */
router.post('/process-ai-prompt', validate(processAIPromptSchema), async (req, res, next) => {
  try {
    const { prompt, cvData, warnings } = req.body;

    // This would integrate with AI service to process the prompt

    res.json({
      success: true,
      data: {
        personal: {
          fullName: 'Improved Name',
          bio: 'Improved bio based on AI suggestions',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
