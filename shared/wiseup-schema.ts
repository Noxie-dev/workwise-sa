import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { users } from "./schema";

// WiseUp content items schema
export const wiseup_content = pgTable("wiseup_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  creator: jsonb("creator").notNull(), // JSON with name and avatar
  video: text("video").notNull(),
  description: text("description").notNull(),
  resources: jsonb("resources"), // JSON array of resources
  tags: jsonb("tags"), // JSON array of tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWiseUpContentSchema = createInsertSchema(wiseup_content).pick({
  title: true,
  creator: true,
  video: true,
  description: true,
  resources: true,
  tags: true,
});

// WiseUp ad items schema
export const wiseup_ads = pgTable("wiseup_ads", {
  id: serial("id").primaryKey(),
  advertiser: text("advertiser").notNull(),
  title: text("title").notNull(),
  video: text("video").notNull(),
  cta: text("cta").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  targetInterests: jsonb("target_interests"), // JSON array of interests for targeting
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWiseUpAdSchema = createInsertSchema(wiseup_ads).pick({
  advertiser: true,
  title: true,
  video: true,
  cta: true,
  description: true,
  notes: true,
  targetInterests: true,
  active: true,
});

// WiseUp bookmarks schema
export const wiseup_bookmarks = pgTable("wiseup_bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Firebase UID
  wiseUpItemId: text("wiseup_item_id").notNull(),
  itemType: text("item_type").notNull(), // 'content' or 'ad'
  bookmarkedAt: timestamp("bookmarked_at").defaultNow(),
});

export const insertWiseUpBookmarkSchema = createInsertSchema(wiseup_bookmarks).pick({
  userId: true,
  wiseUpItemId: true,
  itemType: true,
});

// WiseUp ad impressions schema
export const wiseup_ad_impressions = pgTable("wiseup_ad_impressions", {
  id: serial("id").primaryKey(),
  adId: integer("ad_id").notNull(),
  userId: text("user_id").notNull(), // Firebase UID or 'anonymous'
  timestamp: timestamp("timestamp").defaultNow(),
  platform: text("platform").default("web"),
});

export const insertWiseUpAdImpressionSchema = createInsertSchema(wiseup_ad_impressions).pick({
  adId: true,
  userId: true,
  platform: true,
});

// WiseUp user progress schema
export const wiseup_user_progress = pgTable("wiseup_user_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Firebase UID
  contentId: integer("content_id").notNull(),
  progress: integer("progress").default(0), // 0-100 percentage
  completed: boolean("completed").default(false),
  lastWatched: timestamp("last_watched").defaultNow(),
});

export const insertWiseUpUserProgressSchema = createInsertSchema(wiseup_user_progress).pick({
  userId: true,
  contentId: true,
  progress: true,
  completed: true,
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
