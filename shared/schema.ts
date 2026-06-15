import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Enhanced user schema for job matching
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password'),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  firebaseUid: text('firebase_uid').unique(),
  role: text('role').default('user'),
  location: text('location'),
  bio: text('bio'),
  phoneNumber: text('phone_number'),
  willingToRelocate: boolean('willing_to_relocate').default(false),
  // Store preferences as JSON
  preferences: jsonb('preferences'), // JSON with preferred categories, job types, etc
  experience: jsonb('experience'), // JSON with experience details
  education: jsonb('education'), // JSON with education details
  skills: jsonb('skills'), // JSON with skills
  referredByUserId: integer('referred_by_user_id'),
  lastActive: timestamp('last_active'),
  engagementScore: integer('engagement_score').default(0), // Tracks user engagement
  notificationPreference: boolean('notification_preference').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  firebaseUid: true,
  role: true,
  location: true,
  bio: true,
  phoneNumber: true,
  willingToRelocate: true,
  preferences: true,
  experience: true,
  education: true,
  skills: true,
  referredByUserId: true,
  notificationPreference: true,
});

// Job categories schema
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  slug: text('slug').notNull().unique(),
  jobCount: integer('job_count').default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  slug: true,
  jobCount: true,
});

// Companies schema
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  location: text('location'),
  slug: text('slug').notNull().unique(),
  openPositions: integer('open_positions').default(0),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  logo: true,
  location: true,
  slug: true,
  openPositions: true,
});

// Jobs schema
export const jobs = pgTable(
  'jobs',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    location: text('location').notNull(),
    salary: text('salary'),
    jobType: text('job_type').notNull(), // Full-time, Part-time, Contract
    workMode: text('work_mode').notNull(), // Remote, On-site, Hybrid
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    ownerUserId: integer('owner_user_id').references(() => users.id),
    employerPostingMetadata: jsonb('employer_posting_metadata'),
    status: text('status').notNull().default('active'),
    isFeatured: boolean('is_featured').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    createdAtIdx: index('idx_jobs_created_at').on(table.createdAt),
    statusCreatedAtIdx: index('idx_jobs_status_created_at').on(table.status, table.createdAt),
  })
);

export const jobIngestRecords = pgTable(
  'job_ingest_records',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id),
    sourceSite: text('source_site').notNull(),
    sourceUrl: text('source_url').notNull(),
    externalId: text('external_id').notNull(),
    applyUrl: text('apply_url'),
    postedAt: timestamp('posted_at'),
    fingerprint: text('fingerprint').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    sourceExternalUnique: uniqueIndex('job_ingest_records_source_external_idx').on(
      table.sourceSite,
      table.externalId
    ),
    fingerprintUnique: uniqueIndex('job_ingest_records_fingerprint_idx').on(table.fingerprint),
  })
);

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  description: true,
  location: true,
  salary: true,
  jobType: true,
  workMode: true,
  companyId: true,
  categoryId: true,
  ownerUserId: true,
  employerPostingMetadata: true,
  status: true,
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

export type InsertJobIngestRecord = typeof jobIngestRecords.$inferInsert;
export type JobIngestRecord = typeof jobIngestRecords.$inferSelect;

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

export const jobIngestRecordsRelations = relations(jobIngestRecords, ({ one }) => ({
  job: one(jobs, {
    fields: [jobIngestRecords.jobId],
    references: [jobs.id],
  }),
}));

// User engagement tracking tables
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in seconds
  device: text('device'),
  ipAddress: text('ip_address'),
});

export const userInteractions = pgTable(
  'user_interactions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    interactionType: text('interaction_type').notNull(), // 'view', 'apply', 'save', 'share', 'video_watch'
    interactionTime: timestamp('interaction_time').notNull().defaultNow(),
    jobId: integer('job_id').references(() => jobs.id),
    videoId: text('video_id'), // For Wise-Up videos
    categoryId: integer('category_id').references(() => categories.id),
    duration: integer('duration'), // For video watches, in seconds
    metadata: jsonb('metadata'), // Additional data
  },
  table => ({
    jobTimeIdx: index('idx_user_interactions_job_time').on(table.jobId, table.interactionTime),
  })
);

export const jobApplications = pgTable(
  'job_applications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id),
    status: text('status').notNull().default('applied'), // applied, reviewed, interview, rejected, hired
    appliedAt: timestamp('applied_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    resumeUrl: text('resume_url'),
    coverLetter: text('cover_letter'),
    notes: text('notes'),
  },
  table => ({
    userJobUnique: uniqueIndex('idx_job_applications_user_job_unique').on(
      table.userId,
      table.jobId
    ),
    jobStatusIdx: index('idx_job_applications_job_status').on(table.jobId, table.status),
  })
);

export const userNotifications = pgTable(
  'user_notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(), // 'job_match', 'status_update', etc.
    content: text('content').notNull(),
    jobId: integer('job_id').references(() => jobs.id),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sentAt: timestamp('sent_at'),
  },
  table => ({
    userReadCreatedIdx: index('idx_user_notifications_user_read_created').on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
  })
);

export const userFavoriteJobs = pgTable(
  'user_favorite_jobs',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    pk: primaryKey({ columns: [table.userId, table.jobId] }),
    userCreatedIdx: index('idx_user_favorite_jobs_user_created').on(table.userId, table.createdAt),
  })
);

export const userJobPreferences = pgTable('user_job_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  preferredCategories: jsonb('preferred_categories'), // Array of category IDs
  preferredLocations: jsonb('preferred_locations'), // Array of locations
  preferredJobTypes: jsonb('preferred_job_types'), // Array of job types
  willingToRelocate: boolean('willing_to_relocate').default(false),
  minSalary: integer('min_salary'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adCampaigns = pgTable(
  'ad_campaigns',
  {
    id: serial('id').primaryKey(),
    advertiserName: text('advertiser_name').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    placement: text('placement').notNull(),
    imageUrl: text('image_url'),
    targetUrl: text('target_url').notNull(),
    startAt: timestamp('start_at'),
    endAt: timestamp('end_at'),
    budgetCents: integer('budget_cents').notNull().default(0),
    currency: text('currency').notNull().default('ZAR'),
    status: text('status').notNull().default('draft'),
    impressions: integer('impressions').notNull().default(0),
    clicks: integer('clicks').notNull().default(0),
    createdByUserId: integer('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    placementStatusIdx: index('idx_ad_campaigns_placement_status').on(
      table.placement,
      table.status
    ),
    flightIdx: index('idx_ad_campaigns_flight').on(table.startAt, table.endAt),
  })
);

export const billingPlans = pgTable('billing_plans', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('ZAR'),
  billingInterval: text('billing_interval').notNull().default('month'),
  entitlements: jsonb('entitlements'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const billingSubscriptions = pgTable(
  'billing_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    planId: integer('plan_id')
      .notNull()
      .references(() => billingPlans.id),
    provider: text('provider').notNull().default('payfast'),
    providerSubscriptionId: text('provider_subscription_id'),
    providerToken: text('provider_token'),
    status: text('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    gracePeriodEndsAt: timestamp('grace_period_ends_at'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    cancelledAt: timestamp('cancelled_at'),
    expiredAt: timestamp('expired_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    userStatusIdx: index('idx_billing_subscriptions_user_status').on(table.userId, table.status),
    providerSubscriptionIdx: uniqueIndex('idx_billing_subscriptions_provider_subscription').on(
      table.provider,
      table.providerSubscriptionId
    ),
  })
);

export const billingTransactions = pgTable(
  'billing_transactions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    planId: integer('plan_id').references(() => billingPlans.id),
    subscriptionId: integer('subscription_id').references(() => billingSubscriptions.id),
    provider: text('provider').notNull().default('payfast'),
    providerPaymentId: text('provider_payment_id'),
    merchantReference: text('merchant_reference').notNull().unique(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('ZAR'),
    status: text('status').notNull().default('pending'),
    paymentType: text('payment_type').notNull().default('subscription'),
    checkoutUrl: text('checkout_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    userCreatedIdx: index('idx_billing_transactions_user_created').on(
      table.userId,
      table.createdAt
    ),
    providerPaymentIdx: index('idx_billing_transactions_provider_payment').on(
      table.provider,
      table.providerPaymentId
    ),
  })
);

export const billingWebhookEvents = pgTable(
  'billing_webhook_events',
  {
    id: serial('id').primaryKey(),
    provider: text('provider').notNull().default('payfast'),
    eventId: text('event_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    verified: boolean('verified').notNull().default(false),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    providerEventUnique: uniqueIndex('idx_billing_webhook_events_provider_event').on(
      table.provider,
      table.eventId
    ),
  })
);

export const aiUsageEvents = pgTable(
  'ai_usage_events',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    documentType: text('document_type').notNull(),
    jobId: integer('job_id').references(() => jobs.id),
    model: text('model'),
    tokens: integer('tokens').notNull().default(0),
    costEstimateCents: integer('cost_estimate_cents').notNull().default(0),
    generationTimeMs: integer('generation_time_ms').notNull().default(0),
    success: boolean('success').notNull().default(false),
    status: text('status').notNull().default('started'),
    idempotencyKey: text('idempotency_key').notNull(),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  table => ({
    userDocumentIdx: index('idx_ai_usage_events_user_document').on(
      table.userId,
      table.documentType
    ),
    userIdempotencyUnique: uniqueIndex('idx_ai_usage_events_user_idempotency').on(
      table.userId,
      table.idempotencyKey
    ),
  })
);

export const aiGeneratedDocuments = pgTable('ai_generated_documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  usageEventId: integer('usage_event_id').references(() => aiUsageEvents.id),
  documentType: text('document_type').notNull(),
  jobId: integer('job_id').references(() => jobs.id),
  title: text('title'),
  content: jsonb('content').notNull(),
  model: text('model'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const candidatePromotionState = pgTable('candidate_promotion_state', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  boostScore: integer('boost_score').notNull().default(0),
  visibilityMultiplier: integer('visibility_multiplier').notNull().default(100),
  profileStrength: integer('profile_strength').notNull().default(0),
  active: boolean('active').notNull().default(false),
  source: text('source').notNull().default('system'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const proInterest = pgTable(
  'pro_interest',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    email: text('email').notNull(),
    source: text('source').notNull().default('plus_page'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    emailUnique: uniqueIndex('idx_pro_interest_email').on(table.email),
  })
);

// Combined types for the frontend
export type JobWithCompany = Job & {
  company: Company;
};

export type CategoryWithJobs = Category & {
  jobs: JobWithCompany[];
};

// Files storage schema
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  originalName: text('original_name').notNull(),
  storagePath: text('storage_path').notNull(),
  fileUrl: text('file_url').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // in bytes
  fileType: text('file_type').notNull(), // 'profile_image', 'cv', etc.
  metadata: jsonb('metadata'), // Additional file metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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

export const insertJobApplicationSchema = createInsertSchema(jobApplications).pick({
  userId: true,
  jobId: true,
  status: true,
  resumeUrl: true,
  coverLetter: true,
  notes: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  interactionType: true,
  interactionTime: true,
  jobId: true,
  videoId: true,
  categoryId: true,
  duration: true,
  metadata: true,
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).pick({
  userId: true,
  type: true,
  content: true,
  jobId: true,
  isRead: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig);
export const insertAdCampaignSchema = createInsertSchema(adCampaigns).pick({
  advertiserName: true,
  title: true,
  description: true,
  placement: true,
  imageUrl: true,
  targetUrl: true,
  startAt: true,
  endAt: true,
  budgetCents: true,
  currency: true,
  status: true,
  createdByUserId: true,
});
export const insertBillingPlanSchema = createInsertSchema(billingPlans);
export const insertBillingSubscriptionSchema = createInsertSchema(billingSubscriptions);
export const insertBillingTransactionSchema = createInsertSchema(billingTransactions);
export const insertBillingWebhookEventSchema = createInsertSchema(billingWebhookEvents);
export const insertAiUsageEventSchema = createInsertSchema(aiUsageEvents);
export const insertAiGeneratedDocumentSchema = createInsertSchema(aiGeneratedDocuments);
export const insertCandidatePromotionStateSchema = createInsertSchema(candidatePromotionState);
export const insertProInterestSchema = createInsertSchema(proInterest);

// Export additional types for the new tables
export type UserSession = typeof userSessions.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type UserFavoriteJob = typeof userFavoriteJobs.$inferSelect;
export type UserJobPreference = typeof userJobPreferences.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type InsertBillingSubscription = z.infer<typeof insertBillingSubscriptionSchema>;
export type BillingTransaction = typeof billingTransactions.$inferSelect;
export type InsertBillingTransaction = z.infer<typeof insertBillingTransactionSchema>;
export type BillingWebhookEvent = typeof billingWebhookEvents.$inferSelect;
export type InsertBillingWebhookEvent = z.infer<typeof insertBillingWebhookEventSchema>;
export type AiUsageEvent = typeof aiUsageEvents.$inferSelect;
export type InsertAiUsageEvent = z.infer<typeof insertAiUsageEventSchema>;
export type AiGeneratedDocument = typeof aiGeneratedDocuments.$inferSelect;
export type InsertAiGeneratedDocument = z.infer<typeof insertAiGeneratedDocumentSchema>;
export type CandidatePromotionState = typeof candidatePromotionState.$inferSelect;
export type InsertCandidatePromotionState = z.infer<typeof insertCandidatePromotionStateSchema>;
export type ProInterest = typeof proInterest.$inferSelect;
export type InsertProInterest = z.infer<typeof insertProInterestSchema>;

// Import WiseUp schema
export * from './wiseup-schema';
