import { z } from 'zod';

export const resourceCategorySchema = z.enum([
  'cv',
  'interviews',
  'job-search',
  'salary',
  'workplace',
  'support',
]);

export const resourceDifficultySchema = z.enum(['quick', 'beginner', 'practical', 'advanced']);

export const resourceFormatSchema = z.enum(['guide', 'tool', 'template', 'checklist', 'article']);

export const resourceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: resourceCategorySchema,
  format: resourceFormatSchema,
  difficulty: resourceDifficultySchema,
  durationMinutes: z.number().int().min(1),
  href: z.string(),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
});

export const resourceCollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  resourceIds: z.array(z.string()),
});

export const resourcesResponseSchema = z.object({
  resources: z.array(resourceItemSchema),
  featured: z.array(resourceItemSchema),
  collections: z.array(resourceCollectionSchema),
  filters: z.object({
    categories: z.array(resourceCategorySchema),
    formats: z.array(resourceFormatSchema),
    difficulties: z.array(resourceDifficultySchema),
  }),
  meta: z.object({
    total: z.number().int().min(0),
    returned: z.number().int().min(0),
    query: z.string(),
  }),
});

export type ResourceCategory = z.infer<typeof resourceCategorySchema>;
export type ResourceDifficulty = z.infer<typeof resourceDifficultySchema>;
export type ResourceFormat = z.infer<typeof resourceFormatSchema>;
export type ResourceItem = z.infer<typeof resourceItemSchema>;
export type ResourceCollection = z.infer<typeof resourceCollectionSchema>;
export type ResourcesResponse = z.infer<typeof resourcesResponseSchema>;
