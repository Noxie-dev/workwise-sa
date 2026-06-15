import { z } from 'zod';

export const wiseupSourceTypeSchema = z.enum(['mp4', 'hls', 'webm', 'mov']);

export const wiseupCreatorSchema = z.object({
  name: z.string(),
  role: z.string().default('Creator'),
  avatar: z.string().optional().default(''),
});

export const wiseupResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['article', 'download', 'job', 'external']).optional().default('external'),
});

export const wiseupCaptionSchema = z.object({
  label: z.string(),
  srclang: z.string(),
  src: z.string(),
  default: z.boolean().optional().default(false),
});

export const wiseupChapterSchema = z.object({
  title: z.string(),
  startSec: z.number().nonnegative(),
});

export const wiseupTranscriptCueSchema = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative().optional(),
  text: z.string(),
});

export const wiseupMediaSchema = z.object({
  src: z.string(),
  sourceType: wiseupSourceTypeSchema.default('mp4'),
  poster: z.string().optional().default(''),
  thumbnail: z.string().optional().default(''),
  durationSec: z.number().nonnegative().optional().default(0),
  aspectRatio: z.string().optional().default('16 / 9'),
  captions: z.array(wiseupCaptionSchema).optional().default([]),
  chapters: z.array(wiseupChapterSchema).optional().default([]),
  transcript: z.array(wiseupTranscriptCueSchema).optional().default([]),
});

const wiseupBaseItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  slug: z.string().optional(),
  title: z.string(),
  video: z.string(),
  media: wiseupMediaSchema,
  description: z.string(),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('career'),
  likeCount: z.number().int().nonnegative().optional().default(0),
  commentCount: z.number().int().nonnegative().optional().default(0),
  bookmarkCount: z.number().int().nonnegative().optional().default(0),
  progress: z.number().min(0).max(100).optional().default(0),
  completed: z.boolean().optional().default(false),
  bookmarked: z.boolean().optional().default(false),
});

export const wiseupContentItemSchema = wiseupBaseItemSchema.extend({
  type: z.literal('content'),
  creator: wiseupCreatorSchema,
  resources: z.array(wiseupResourceSchema).optional().default([]),
});

export const wiseupAdCtaSchema = z.object({
  primary: z.object({
    text: z.string(),
    url: z.string(),
  }),
  secondary: z
    .object({
      text: z.string(),
      url: z.string(),
    })
    .optional(),
});

export const wiseupAdItemSchema = wiseupBaseItemSchema.extend({
  type: z.literal('ad'),
  advertiser: z.string(),
  cta: wiseupAdCtaSchema,
  notes: z.string().optional().default(''),
  sponsored: z.boolean().optional().default(true),
});

export const wiseupFeedItemSchema = z.union([wiseupContentItemSchema, wiseupAdItemSchema]);

export const wiseupFeedResponseSchema = z.object({
  items: z.array(wiseupFeedItemSchema),
  nextCursor: z.string().nullable(),
});

export const wiseupEventSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['content', 'ad']),
  eventType: z.enum([
    'view',
    'play',
    'pause',
    'seek',
    'progress',
    'complete',
    'error',
    'share',
    'cta_click',
  ]),
  sessionId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  currentTimeSec: z.number().nonnegative().optional(),
  durationSec: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const wiseupProgressSchema = z.object({
  contentId: z.coerce.number().int().positive(),
  progress: z.number().min(0).max(100),
  completed: z.boolean().optional().default(false),
});

export const wiseupCommentSchema = z.object({
  id: z.union([z.number(), z.string()]),
  itemId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().nullable().optional(),
  text: z.string(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type WiseUpSourceType = z.infer<typeof wiseupSourceTypeSchema>;
export type WiseUpCreator = z.infer<typeof wiseupCreatorSchema>;
export type WiseUpResource = z.infer<typeof wiseupResourceSchema>;
export type WiseUpCaption = z.infer<typeof wiseupCaptionSchema>;
export type WiseUpChapter = z.infer<typeof wiseupChapterSchema>;
export type WiseUpTranscriptCue = z.infer<typeof wiseupTranscriptCueSchema>;
export type WiseUpMedia = z.infer<typeof wiseupMediaSchema>;
export type WiseUpContentItem = z.infer<typeof wiseupContentItemSchema>;
export type WiseUpAdItem = z.infer<typeof wiseupAdItemSchema>;
export type WiseUpFeedItem = z.infer<typeof wiseupFeedItemSchema>;
export type WiseUpFeedResponse = z.infer<typeof wiseupFeedResponseSchema>;
export type WiseUpEvent = z.infer<typeof wiseupEventSchema>;
export type WiseUpProgress = z.infer<typeof wiseupProgressSchema>;
export type WiseUpComment = z.infer<typeof wiseupCommentSchema>;
