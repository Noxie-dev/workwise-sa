import { z } from 'zod';

export const SQUAREJUMP_TAXONOMY_VERSION = 'za-jobs-v1';
export const OPPORTUNITY_POLICY_VERSION = 'opportunity-v1.0';
export const MATCH_POLICY_VERSION = 'match-v1.0';
export const RELEASE_POLICY_VERSION = 'release-v1.0';

export const categoryCodeSchema = z.enum([
  'SEC',
  'RET',
  'CAS',
  'GEN',
  'CLN',
  'WHR',
  'MFG',
  'DRV',
  'LOG',
  'PET',
  'CAL',
  'CON',
  'HSP',
  'DOM',
  'ADM',
  'TRD',
  'SAL',
  'LNR',
  'OTH',
]);

export const matchProfileSchema = z
  .object({
    preferredCategoryCodes: z.array(categoryCodeSchema).max(20).default([]),
    preferredOccupationCodes: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
    preferredLocationCodes: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
    travelRadiusKm: z.number().int().min(0).max(500).default(50),
    workModes: z
      .array(z.enum(['remote', 'on-site', 'hybrid']))
      .max(3)
      .default([]),
    employmentTypes: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    minimumSalaryCents: z.number().int().nonnegative().nullable().default(null),
    skills: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
    qualifications: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
    licences: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    certifications: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    behaviouralPersonalisationEnabled: z.boolean().default(true),
  })
  .strict();

export const recommendationQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: categoryCodeSchema.optional(),
  location: z.string().trim().min(1).max(100).optional(),
  employmentType: z.string().trim().min(1).max(50).optional(),
  minimumMatch: z.coerce.number().int().min(0).max(100).default(0),
  surface: z.string().trim().min(1).max(50).default('square-jobs-feed'),
});

export const jobEventSchema = z
  .object({
    jobJuid: z.string().regex(/^juid_sq_[0-9A-Z_a-z-]+$/),
    eventType: z.enum([
      'impression',
      'qualified_view',
      'save',
      'share',
      'hide',
      'report',
      'application_start',
      'application_complete',
      'outbound_application',
      'broken_link',
    ]),
    trackingToken: z.string().trim().min(16).max(200),
    durationSeconds: z.number().int().min(0).max(86400).optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export const policySimulationSchema = z
  .object({
    policyType: z.enum(['opportunity', 'match', 'placement', 'release']),
    version: z.string().trim().min(1).max(80),
    weights: z.record(z.string(), z.number().min(0).max(100)),
    thresholds: z.record(z.string(), z.number()),
  })
  .strict();

export type CategoryCode = z.infer<typeof categoryCodeSchema>;
export type MatchProfile = z.infer<typeof matchProfileSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type JobEventInput = z.infer<typeof jobEventSchema>;
export type PolicySimulationInput = z.infer<typeof policySimulationSchema>;

export type RequirementNecessity = 'mandatory' | 'preferred' | 'inferred' | 'unknown';

export type ClassifiedRequirement = {
  type: 'skill' | 'qualification' | 'licence' | 'certification' | 'experience';
  code?: string;
  label: string;
  necessity: RequirementNecessity;
  confidence: number;
  source: 'rules' | 'source' | 'classifier';
};

export type ClassificationResult = {
  primaryCategoryCode: CategoryCode;
  secondaryCategoryCodes: CategoryCode[];
  occupationCode?: string;
  confidence: number;
  status: 'accepted' | 'provisional' | 'broad' | 'review';
  source: 'alias' | 'rules' | 'mapping' | 'fallback';
  taxonomyVersion: string;
};
