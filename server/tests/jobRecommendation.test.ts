import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../db';
import { 
  getJobRecommendations,
  calculateUserEngagementScore,
  getUserEngagementTier,
  isEligibleForEarlyNotifications,
  sendJobNotificationToUser,
  trackUserInteraction,
  startUserSession,
  endUserSession,
  personalizedJobSearch
} from '../jobRecommendation';
import { 
  users, 
  jobs, 
  companies, 
  userInteractions, 
  userSessions,
  userNotifications
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    and: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    desc: vi.fn(),
    inArray: vi.fn(),
    like: vi.fn(),
    or: vi.fn()
  }
}));

describe('Job Recommendation System', () => {
  const mockUser = {
    id: 1,
    engagementScore: 200,
    notificationPreference: true,
    lastActive: new Date()
  };

  const mockCompany = {
    id: 1,
    name: 'Tech Corp',
    location: 'Riyadh'
  };

  const mockJob = {
    id: 1,
    title: 'Senior Frontend Developer',
    description: 'Looking for a skilled developer with experience in JavaScript, React, and TypeScript.',
    location: 'Riyadh',
    companyId: 1,
    categoryId: 1,
    createdAt: new Date()
  };

  const mockJobWithCompany = {
    ...mockJob,
    company: mockCompany
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock database responses
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser])
      })
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser])
      })
    });

    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 1 }])
    });
  });

  describe('getJobRecommendations', () => {
    it('should return job recommendations for a user', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockJobWithCompany])
        })
      });

      const recommendations = await getJobRecommendations(1);
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toHaveProperty('id');
      expect(recommendations[0]).toHaveProperty('company');
    });

    it('should handle empty recommendations gracefully', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const recommendations = await getJobRecommendations(1);
      
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('User Engagement', () => {
    it('should calculate user engagement score correctly', async () => {
      const mockSessions = [
        { duration: 3600 },
        { duration: 1800 }
      ];

      const mockInteractions = [
        { interactionType: 'view' },
        { interactionType: 'apply' },
        { interactionType: 'save' }
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSessions)
        })
      });

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockInteractions)
        })
      });

      const score = await calculateUserEngagementScore(1);
      
      expect(score).toBeGreaterThan(0);
    });

    it('should determine correct engagement tier', () => {
      expect(getUserEngagementTier(0)).toBe('low');
      expect(getUserEngagementTier(50)).toBe('medium');
      expect(getUserEngagementTier(150)).toBe('high');
      expect(getUserEngagementTier(300)).toBe('premium');
    });
  });

  describe('Notifications', () => {
    it('should check eligibility for early notifications', async () => {
      const result = await isEligibleForEarlyNotifications(1);
      
      expect(result).toBe(true); // User has high engagement score
    });

    it('should send job notifications correctly', async () => {
      const result = await sendJobNotificationToUser(1, 1);
      
      expect(result).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should track user interactions', async () => {
      await trackUserInteraction(1, 'view', { jobId: 1 });
      
      expect(db.insert).toHaveBeenCalled();
    });

    it('should manage user sessions', async () => {
      const sessionId = await startUserSession(1, { device: 'web' });
      
      expect(sessionId).toBeGreaterThan(0);
      
      await endUserSession(sessionId);
      
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('Personalized Job Search', () => {
    it('should perform personalized job search', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockJobWithCompany])
        })
      });

      const results = await personalizedJobSearch(1, 'frontend developer');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('company');
    });

    it('should handle empty search results', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const results = await personalizedJobSearch(1, 'nonexistent job');
      
      expect(results).toHaveLength(0);
    });
  });
}); 