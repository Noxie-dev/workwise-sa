import { z } from "zod";

export const wiseupCreatorSchema = z.object({
  name: z.string(),
  role: z.string().default("Creator"),
  avatar: z.string(),
});

export const wiseupResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const wiseupContentItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  type: z.literal("content"),
  title: z.string(),
  creator: wiseupCreatorSchema,
  video: z.string(),
  description: z.string(),
  resources: z.array(wiseupResourceSchema),
  tags: z.array(z.string()),
});

export const wiseupAdCtaSchema = z.object({
  primary: z.object({
    text: z.string(),
    url: z.string(),
  }),
  secondary: z.object({
    text: z.string(),
    url: z.string(),
  }),
});

export const wiseupAdItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  type: z.literal("ad"),
  advertiser: z.string(),
  title: z.string(),
  video: z.string(),
  cta: wiseupAdCtaSchema,
  description: z.string(),
  notes: z.string(),
});

export const wiseupFeedItemSchema = z.union([wiseupContentItemSchema, wiseupAdItemSchema]);

export type WiseUpCreator = z.infer<typeof wiseupCreatorSchema>;
export type WiseUpResource = z.infer<typeof wiseupResourceSchema>;
export type WiseUpContentItem = z.infer<typeof wiseupContentItemSchema>;
export type WiseUpAdItem = z.infer<typeof wiseupAdItemSchema>;
export type WiseUpFeedItem = z.infer<typeof wiseupFeedItemSchema>;
