import { z } from 'zod';

export const adPlacementSchema = z.enum([
  'global-top-banner',
  'home-inline',
  'jobs-inline',
  'wiseup-inline',
  'footer-banner',
]);

export const adSizeSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
});

export const adCreativeTypeSchema = z.enum([
  'display',
  'video',
  'embed',
  'notification',
  'promotion',
  'wiseup-promo',
]);

export const adSlotSchema = z.object({
  placement: adPlacementSchema,
  enabled: z.boolean(),
  maxAds: z.number().int().min(1).max(5),
  frequency: z.number().int().min(1).max(12),
  sizes: z.object({
    mobile: adSizeSchema,
    tablet: adSizeSchema,
    desktop: adSizeSchema,
  }),
  targeting: z.object({
    mobileOnly: z.boolean().default(false),
    allowedFormats: z.array(z.enum(['display', 'native', 'video'])).min(1),
  }),
  fallbackLabel: z.string().min(1),
  canSkip: z.boolean().default(false),
  creative: z
    .object({
      id: z.number().int(),
      advertiserName: z.string(),
      title: z.string(),
      description: z.string().nullable().optional(),
      creativeType: adCreativeTypeSchema.default('display'),
      imageUrl: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
      embedUrl: z.string().nullable().optional(),
      targetUrl: z.string(),
      budgetCents: z.number().int(),
      currency: z.string(),
      startAt: z.string().nullable().optional(),
      endAt: z.string().nullable().optional(),
      impressions: z.number().int(),
      clicks: z.number().int(),
    })
    .optional(),
});

export const adEventSchema = z.object({
  placement: adPlacementSchema,
  eventType: z.enum(['impression', 'click', 'viewable']),
  creativeId: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AdPlacement = z.infer<typeof adPlacementSchema>;
export type AdCreativeType = z.infer<typeof adCreativeTypeSchema>;
export type AdSlotConfig = z.infer<typeof adSlotSchema>;
export type AdEvent = z.infer<typeof adEventSchema>;

export const defaultAdSlots: Record<AdPlacement, AdSlotConfig> = {
  'global-top-banner': {
    placement: 'global-top-banner',
    enabled: true,
    maxAds: 1,
    frequency: 1,
    sizes: {
      mobile: { width: 240, height: 160 },
      tablet: { width: 420, height: 280 },
      desktop: { width: 480, height: 320 },
    },
    targeting: {
      mobileOnly: false,
      allowedFormats: ['display', 'video', 'native'],
    },
    fallbackLabel: 'WorkWise Display',
    canSkip: false,
  },
  'home-inline': {
    placement: 'home-inline',
    enabled: true,
    maxAds: 1,
    frequency: 6,
    sizes: {
      mobile: { width: 320, height: 250 },
      tablet: { width: 468, height: 60 },
      desktop: { width: 728, height: 90 },
    },
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'display'],
    },
    fallbackLabel: 'Sponsored opportunities',
    canSkip: false,
  },
  'jobs-inline': {
    placement: 'jobs-inline',
    enabled: true,
    maxAds: 2,
    frequency: 8,
    sizes: {
      mobile: { width: 320, height: 250 },
      tablet: { width: 468, height: 60 },
      desktop: { width: 728, height: 90 },
    },
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'display'],
    },
    fallbackLabel: 'Sponsored jobs',
    canSkip: false,
  },
  'wiseup-inline': {
    placement: 'wiseup-inline',
    enabled: true,
    maxAds: 2,
    frequency: 3,
    sizes: {
      mobile: { width: 300, height: 250 },
      tablet: { width: 468, height: 60 },
      desktop: { width: 728, height: 90 },
    },
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'video'],
    },
    fallbackLabel: 'Sponsored learning',
    canSkip: false,
  },
  'footer-banner': {
    placement: 'footer-banner',
    enabled: false,
    maxAds: 1,
    frequency: 12,
    sizes: {
      mobile: { width: 320, height: 50 },
      tablet: { width: 728, height: 90 },
      desktop: { width: 970, height: 90 },
    },
    targeting: {
      mobileOnly: true,
      allowedFormats: ['display'],
    },
    fallbackLabel: 'Sponsored placement',
    canSkip: false,
  },
};
