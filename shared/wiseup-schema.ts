import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// WiseUp content items schema
export const wiseup_content = pgTable('wiseup_content', {
  id: serial('id').primaryKey(),
  slug: text('slug'),
  title: text('title').notNull(),
  creator: jsonb('creator').notNull(), // JSON with name and avatar
  video: text('video').notNull(),
  sourceType: text('source_type').default('mp4'),
  poster: text('poster'),
  thumbnail: text('thumbnail'),
  durationSec: integer('duration_sec').default(0),
  aspectRatio: text('aspect_ratio').default('16 / 9'),
  description: text('description').notNull(),
  resources: jsonb('resources'), // JSON array of resources
  tags: jsonb('tags'), // JSON array of tags
  captions: jsonb('captions'),
  chapters: jsonb('chapters'),
  transcript: jsonb('transcript'),
  category: text('category').default('career'),
  active: boolean('active').default(true),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  bookmarkCount: integer('bookmark_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertWiseUpContentSchema = createInsertSchema(wiseup_content).pick({
  title: true,
  slug: true,
  creator: true,
  video: true,
  sourceType: true,
  poster: true,
  thumbnail: true,
  durationSec: true,
  aspectRatio: true,
  description: true,
  resources: true,
  tags: true,
  captions: true,
  chapters: true,
  transcript: true,
  category: true,
  active: true,
});

// WiseUp ad items schema
export const wiseup_ads = pgTable('wiseup_ads', {
  id: serial('id').primaryKey(),
  slug: text('slug'),
  advertiser: text('advertiser').notNull(),
  title: text('title').notNull(),
  video: text('video').notNull(),
  sourceType: text('source_type').default('mp4'),
  poster: text('poster'),
  thumbnail: text('thumbnail'),
  durationSec: integer('duration_sec').default(0),
  aspectRatio: text('aspect_ratio').default('16 / 9'),
  cta: text('cta').notNull(),
  description: text('description').notNull(),
  notes: text('notes'),
  targetInterests: jsonb('target_interests'), // JSON array of interests for targeting
  captions: jsonb('captions'),
  chapters: jsonb('chapters'),
  transcript: jsonb('transcript'),
  category: text('category').default('sponsored'),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  bookmarkCount: integer('bookmark_count').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertWiseUpAdSchema = createInsertSchema(wiseup_ads).pick({
  advertiser: true,
  slug: true,
  title: true,
  video: true,
  sourceType: true,
  poster: true,
  thumbnail: true,
  durationSec: true,
  aspectRatio: true,
  cta: true,
  description: true,
  notes: true,
  targetInterests: true,
  captions: true,
  chapters: true,
  transcript: true,
  category: true,
  active: true,
});

// WiseUp bookmarks schema
export const wiseup_bookmarks = pgTable('wiseup_bookmarks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID
  wiseUpItemId: text('wiseup_item_id').notNull(),
  itemType: text('item_type').notNull(), // 'content' or 'ad'
  bookmarkedAt: timestamp('bookmarked_at').defaultNow(),
});

export const insertWiseUpBookmarkSchema = createInsertSchema(wiseup_bookmarks).pick({
  userId: true,
  wiseUpItemId: true,
  itemType: true,
});

// WiseUp ad impressions schema
export const wiseup_ad_impressions = pgTable('wiseup_ad_impressions', {
  id: serial('id').primaryKey(),
  adId: integer('ad_id').notNull(),
  userId: text('user_id').notNull(), // Firebase UID or 'anonymous'
  timestamp: timestamp('timestamp').defaultNow(),
  platform: text('platform').default('web'),
});

export const insertWiseUpAdImpressionSchema = createInsertSchema(wiseup_ad_impressions).pick({
  adId: true,
  userId: true,
  platform: true,
});

// WiseUp user progress schema
export const wiseup_user_progress = pgTable('wiseup_user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID
  contentId: integer('content_id').notNull(),
  progress: integer('progress').default(0), // 0-100 percentage
  completed: boolean('completed').default(false),
  lastWatched: timestamp('last_watched').defaultNow(),
});

export const insertWiseUpUserProgressSchema = createInsertSchema(wiseup_user_progress).pick({
  userId: true,
  contentId: true,
  progress: true,
  completed: true,
});

export const wiseup_comments = pgTable(
  'wiseup_comments',
  {
    id: serial('id').primaryKey(),
    itemId: text('item_id').notNull(),
    itemType: text('item_type').notNull(),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    userAvatar: text('user_avatar'),
    text: text('text').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    itemCreatedIdx: index('idx_wiseup_comments_item_created').on(table.itemId, table.createdAt),
  })
);

export const insertWiseUpCommentSchema = createInsertSchema(wiseup_comments).pick({
  itemId: true,
  itemType: true,
  userId: true,
  userName: true,
  userAvatar: true,
  text: true,
});

export const wiseup_events = pgTable(
  'wiseup_events',
  {
    id: serial('id').primaryKey(),
    itemId: text('item_id').notNull(),
    itemType: text('item_type').notNull(),
    eventType: text('event_type').notNull(),
    userId: text('user_id'),
    sessionId: text('session_id'),
    progress: integer('progress'),
    currentTimeSec: integer('current_time_sec'),
    durationSec: integer('duration_sec'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    itemEventCreatedIdx: index('idx_wiseup_events_item_event_created').on(
      table.itemId,
      table.eventType,
      table.createdAt
    ),
    sessionCreatedIdx: index('idx_wiseup_events_session_created').on(
      table.sessionId,
      table.createdAt
    ),
  })
);

export const insertWiseUpEventSchema = createInsertSchema(wiseup_events).pick({
  itemId: true,
  itemType: true,
  eventType: true,
  userId: true,
  sessionId: true,
  progress: true,
  currentTimeSec: true,
  durationSec: true,
  metadata: true,
});

// Export types for the WiseUp tables
export type WiseUpContent = typeof wiseup_content.$inferSelect;
export type InsertWiseUpContent = z.infer<typeof insertWiseUpContentSchema>;

export type WiseUpAd = typeof wiseup_ads.$inferSelect;
export type InsertWiseUpAd = z.infer<typeof insertWiseUpAdSchema>;

export type WiseUpBookmark = typeof wiseup_bookmarks.$inferSelect;
export type InsertWiseUpBookmark = z.infer<typeof insertWiseUpBookmarkSchema>;

export type WiseUpAdImpression = typeof wiseup_ad_impressions.$inferSelect;
export type InsertWiseUpAdImpression = z.infer<typeof insertWiseUpAdImpressionSchema>;

export type WiseUpUserProgress = typeof wiseup_user_progress.$inferSelect;
export type InsertWiseUpUserProgress = z.infer<typeof insertWiseUpUserProgressSchema>;

export type WiseUpCommentRecord = typeof wiseup_comments.$inferSelect;
export type InsertWiseUpComment = z.infer<typeof insertWiseUpCommentSchema>;

export type WiseUpEventRecord = typeof wiseup_events.$inferSelect;
export type InsertWiseUpEvent = z.infer<typeof insertWiseUpEventSchema>;
