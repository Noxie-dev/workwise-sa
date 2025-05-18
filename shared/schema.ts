import { pgTable, text, serial, integer, timestamp, boolean, foreignKey, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enhanced user schema for job matching
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  // Store preferences as JSON
  preferences: jsonb("preferences"), // JSON with preferred categories, job types, etc
  experience: jsonb("experience"), // JSON with experience details
  education: jsonb("education"), // JSON with education details
  skills: jsonb("skills"), // JSON with skills
  lastActive: timestamp("last_active"),
  engagementScore: integer("engagement_score").default(0), // Tracks user engagement
  notificationPreference: boolean("notification_preference").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  location: true,
  bio: true,
  phoneNumber: true,
  willingToRelocate: true,
  notificationPreference: true,
});

// Job categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  slug: text("slug").notNull().unique(),
  jobCount: integer("job_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  slug: true,
  jobCount: true,
});

// Companies schema
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  location: text("location"),
  slug: text("slug").notNull().unique(),
  openPositions: integer("open_positions").default(0),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  logo: true,
  location: true,
  slug: true,
  openPositions: true,
});

// Jobs schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  salary: text("salary"),
  jobType: text("job_type").notNull(), // Full-time, Part-time, Contract
  workMode: text("work_mode").notNull(), // Remote, On-site, Hybrid
  companyId: integer("company_id").notNull().references(() => companies.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  description: true,
  location: true,
  salary: true,
  jobType: true,
  workMode: true,
  companyId: true,
  categoryId: true,
  isFeatured: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  jobs: many(jobs),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [jobs.categoryId],
    references: [categories.id],
  }),
}));

// User engagement tracking tables
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  device: text("device"),
  ipAddress: text("ip_address"),
});

export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interactionType: text("interaction_type").notNull(), // 'view', 'apply', 'save', 'share', 'video_watch'
  interactionTime: timestamp("interaction_time").notNull().defaultNow(),
  jobId: integer("job_id").references(() => jobs.id),
  videoId: text("video_id"), // For Wise-Up videos
  categoryId: integer("category_id").references(() => categories.id),
  duration: integer("duration"), // For video watches, in seconds
  metadata: jsonb("metadata"), // Additional data
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  status: text("status").notNull().default("applied"), // applied, reviewed, interview, rejected, hired
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'job_match', 'status_update', etc.
  content: text("content").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const userJobPreferences = pgTable("user_job_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  preferredCategories: jsonb("preferred_categories"), // Array of category IDs
  preferredLocations: jsonb("preferred_locations"), // Array of locations
  preferredJobTypes: jsonb("preferred_job_types"), // Array of job types
  willingToRelocate: boolean("willing_to_relocate").default(false),
  minSalary: integer("min_salary"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Combined types for the frontend
export type JobWithCompany = Job & {
  company: Company;
};

export type CategoryWithJobs = Category & {
  jobs: JobWithCompany[];
};

// Files storage schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  originalName: text("original_name").notNull(),
  storagePath: text("storage_path").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  fileType: text("file_type").notNull(), // 'profile_image', 'cv', etc.
  metadata: jsonb("metadata"), // Additional file metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  userId: true,
  originalName: true,
  storagePath: true,
  fileUrl: true,
  mimeType: true,
  size: true,
  fileType: true,
  metadata: true,
});

// Export additional types for the new tables
export type UserSession = typeof userSessions.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;
export type UserJobPreference = typeof userJobPreferences.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
