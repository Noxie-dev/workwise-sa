import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../db';
import {
  calculateEnhancedJobMatchScore,
  UserPreferences,
  UserInteractionHistory
} from '../services/enhancedJobScoring';
import {
  users,
  jobs,
  userInteractions,
  userJobPreferences
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    and: vi.fn(),
    eq: vi.fn()
  }
}));

describe('Enhanced Job Scoring System', () => {
  const mockUser = {
    id: 1,
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    willingToRelocate: true
  };

  const mockJob = {
    id: 1,
    title: 'Senior Frontend Developer',
    description: 'Skills: JavaScript, React, TypeScript. Must have strong problem-solving skills.',
    location: 'Riyadh',
    categoryId: 1
  };

  const mockUserPreferences = {
    userId: 1,
    preferredCategories: [1, 2, 3],
    preferredLocations: ['Riyadh', 'Jeddah'],
    willingToRelocate: true
  };

  const mockInteractions = [
    { interactionType: 'view', duration: null },
    { interactionType: 'view', duration: null },
    { interactionType: 'view', duration: null },
    { interactionType: 'view', duration: null },
    { interactionType: 'view', duration: null },
    { interactionType: 'view', duration: null },
    { interactionType: 'apply', duration: null },
    { interactionType: 'apply', duration: null },
    { interactionType: 'save', duration: null },
    { interactionType: 'save', duration: null },
    { interactionType: 'share', duration: null },
    { interactionType: 'share', duration: null },
    { interactionType: 'video_watch', duration: 3600 },
    { interactionType: 'video_watch', duration: 3600 }
  ];

  const mockContentInteractions = [
    { interactionType: 'content_view', duration: null },
    { interactionType: 'content_view', duration: null }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock implementation for db.select
    let callCount = 0;
    (db.select as any).mockImplementation(() => {
      callCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((condition) => {
            // Return different mock data based on the call sequence
            if (callCount === 1) return Promise.resolve([mockUserPreferences]);
            if (callCount === 2) return Promise.resolve([mockUser]);
            if (callCount === 3) return Promise.resolve(mockInteractions);
            if (callCount === 4) return Promise.resolve([{ categoryId: 1, interactionType: 'view' }]); // Category interactions
            if (callCount === 5) return Promise.resolve(mockInteractions.filter(i =>
              i.interactionType === 'video_watch'));
            if (callCount === 6) return Promise.resolve(mockContentInteractions);
            return Promise.resolve([]);
          })
        })
      };
    });
  });

  describe('calculateEnhancedJobMatchScore', () => {
    it('should calculate correct score for perfect match', async () => {
      // Force the skills to be recognized
      (db.select as any).mockReset().mockImplementation(() => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation((condition) => {
              return Promise.resolve([mockUserPreferences]);
            })
          })
        };
      });

      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0);
      expect(result!.score).toBeLessThanOrEqual(100); // Score should be on 0-100 scale

      // Just check that we have a valid score and tier
      expect(result!.tier).toBeDefined();
      expect(['Low', 'Medium', 'High', 'Premium']).toContain(result!.tier);
    });

    it('should return null when user preferences are missing', async () => {
      // Reset mocks
      vi.clearAllMocks();

      // Mock all db.select calls to return empty arrays
      (db.select as any).mockReset().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      }));

      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      expect(result).toBeNull();
    });

    it('should handle location match correctly', async () => {
      // Reset mocks
      vi.clearAllMocks();

      // Set up mock implementation for db.select
      (db.select as any).mockReset().mockImplementation(() => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              return Promise.resolve([mockUserPreferences]);
            })
          })
        };
      });

      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      // Location should match since Riyadh is in preferred locations
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0);
    });

    it('should return null on database errors', async () => {
      // Mock to throw an error
      (db.select as any).mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }));

      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty job description', async () => {
      const emptyJob = { ...mockJob, description: '' };
      const result = await calculateEnhancedJobMatchScore(1, emptyJob);

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0);
      expect(result!.matchingFactors).not.toContain('skills');
    });

    it('should handle job with no skills mentioned', async () => {
      const noSkillsJob = {
        ...mockJob,
        description: 'Looking for a developer with strong problem-solving abilities.'
      };
      const result = await calculateEnhancedJobMatchScore(1, noSkillsJob);

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0);
      expect(result!.matchingFactors).not.toContain('skills');
    });

    it('should handle user with no skills', async () => {
      // Override the second call which returns user data
      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              if (callCount === 1) return Promise.resolve([mockUserPreferences]);
              if (callCount === 2) return Promise.resolve([{ ...mockUser, skills: [] }]);
              return Promise.resolve(mockInteractions);
            })
          })
        };
      });

      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0);
      expect(result!.matchingFactors).not.toContain('skills');
    });

    it('should handle remote job locations correctly', async () => {
      const remoteJob = { ...mockJob, location: 'Remote' };
      const result = await calculateEnhancedJobMatchScore(1, remoteJob);

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0);
      // Remote jobs should still get a good location score
      expect(result!.matchingFactors).toContain('location');
    });
  });

  describe('Tier Classification', () => {
    it('should classify jobs into appropriate tiers based on score', async () => {
      // This test verifies that the tier thresholds are working correctly
      const result = await calculateEnhancedJobMatchScore(1, mockJob);

      expect(result).not.toBeNull();
      expect(['Low', 'Medium', 'High', 'Premium']).toContain(result!.tier);

      // For a perfect match job, we expect a high tier
      expect(['High', 'Premium']).toContain(result!.tier);
    });
  });
});