import { z } from 'zod';

export const adPlacementSchema = z.enum([
  'home-inline',
  'jobs-inline',
  'wiseup-inline',
  'footer-banner',
]);

export const adSlotSchema = z.object({
  placement: adPlacementSchema,
  enabled: z.boolean(),
  maxAds: z.number().int().min(1).max(5),
  frequency: z.number().int().min(1).max(12),
  targeting: z.object({
    mobileOnly: z.boolean().default(false),
    allowedFormats: z.array(z.enum(['display', 'native', 'video'])).min(1),
  }),
  fallbackLabel: z.string().min(1),
});

export const adEventSchema = z.object({
  placement: adPlacementSchema,
  eventType: z.enum(['impression', 'click', 'viewable']),
  creativeId: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AdPlacement = z.infer<typeof adPlacementSchema>;
export type AdSlotConfig = z.infer<typeof adSlotSchema>;
export type AdEvent = z.infer<typeof adEventSchema>;

export const defaultAdSlots: Record<AdPlacement, AdSlotConfig> = {
  'home-inline': {
    placement: 'home-inline',
    enabled: true,
    maxAds: 1,
    frequency: 6,
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'display'],
    },
    fallbackLabel: 'Sponsored opportunities',
  },
  'jobs-inline': {
    placement: 'jobs-inline',
    enabled: true,
    maxAds: 2,
    frequency: 8,
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'display'],
    },
    fallbackLabel: 'Sponsored jobs',
  },
  'wiseup-inline': {
    placement: 'wiseup-inline',
    enabled: true,
    maxAds: 2,
    frequency: 3,
    targeting: {
      mobileOnly: false,
      allowedFormats: ['native', 'video'],
    },
    fallbackLabel: 'Sponsored learning',
  },
  'footer-banner': {
    placement: 'footer-banner',
    enabled: false,
    maxAds: 1,
    frequency: 12,
    targeting: {
      mobileOnly: true,
      allowedFormats: ['display'],
    },
    fallbackLabel: 'Sponsored placement',
  },
};
