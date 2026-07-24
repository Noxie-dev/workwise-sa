import { pgTable, text, serial, integer, timestamp, boolean, jsonb, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enhanced user schema for job matching
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firebaseUid: text("firebase_uid").unique(),
  role: text("role").default("user"),
  location: text("location"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  // Store preferences as JSON
  preferences: jsonb("preferences"), // JSON with preferred categories, job types, etc
  experience: jsonb("experience"), // JSON with experience details
  education: jsonb("education"), // JSON with education details
  skills: jsonb("skills"), // JSON with skills
  referredByUserId: integer("referred_by_user_id"),
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

/**
 * Fields accepted from an unauthenticated registration request.
 *
 * Authorization fields are deliberately excluded: public callers must never
 * choose a Firebase identity mapping, role, referral relationship, or other
 * server-owned attribute.
 */
export const publicUserRegistrationSchema = insertUserSchema
  .pick({
    username: true,
    password: true,
    email: true,
    name: true,
    location: true,
    bio: true,
    phoneNumber: true,
    willingToRelocate: true,
    preferences: true,
    experience: true,
    education: true,
    skills: true,
    notificationPreference: true,
  })
  .extend({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .regex(/^[A-Za-z0-9._-]+$/, "Username contains unsupported characters"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password must be at most 128 characters"),
    email: z.string().email("Invalid email address").max(254),
    name: z.string().trim().min(1, "Name is required").max(120),
  })
  .strict();

/** Fields that an authenticated user may update on their own profile. */
export const publicUserProfileUpdateSchema = insertUserSchema
  .pick({
    username: true,
    email: true,
    name: true,
    location: true,
    bio: true,
    phoneNumber: true,
    willingToRelocate: true,
    preferences: true,
    experience: true,
    education: true,
    skills: true,
    notificationPreference: true,
  })
  .partial()
  .strict();

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
  organisationUid: text("organisation_uid").unique(),
  name: text("name").notNull(),
  logo: text("logo"),
  location: text("location"),
  slug: text("slug").notNull().unique(),
  openPositions: integer("open_positions").default(0),
  organisationType: text("organisation_type").notNull().default("employer"),
  verifiedDomain: text("verified_domain"),
  careerDomain: text("career_domain"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  registrationReference: text("registration_reference"),
  trustStatus: text("trust_status").notNull().default("unknown"),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  organisationUid: true,
  name: true,
  logo: true,
  location: true,
  slug: true,
  openPositions: true,
  organisationType: true,
  verifiedDomain: true,
  careerDomain: true,
  verificationStatus: true,
  registrationReference: true,
  trustStatus: true,
}).partial({
  organisationUid: true,
});

// Jobs schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  // SquareJUMP business identity. The numeric primary key remains in place so
  // existing application and analytics foreign keys do not need to migrate.
  juid: text("juid").notNull().unique(),
  publicJobRef: text("public_job_ref").unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  countryCode: text("country_code").notNull().default("ZA"),
  provinceCode: text("province_code"),
  municipalityCode: text("municipality_code"),
  locationCode: text("location_code"),
  primaryCategoryCode: text("primary_category_code"),
  salary: text("salary"),
  jobType: text("job_type").notNull(), // Full-time, Part-time, Contract
  workMode: text("work_mode").notNull(), // Remote, On-site, Hybrid
  companyId: integer("company_id").notNull().references(() => companies.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  status: text("status").notNull().default("active"),
  riskStatus: text("risk_status").notNull().default("clear"),
  applicationLinkStatus: text("application_link_status").notNull().default("unverified"),
  verifiedAt: timestamp("verified_at"),
  subscriberReleaseAt: timestamp("subscriber_release_at"),
  memberReleaseAt: timestamp("member_release_at"),
  publicReleaseAt: timestamp("public_release_at"),
  expiresAt: timestamp("expires_at"),
  releasePolicyVersion: text("release_policy_version"),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  juidUnique: uniqueIndex("idx_jobs_juid_unique").on(table.juid),
  createdAtIdx: index("idx_jobs_created_at").on(table.createdAt),
  statusCreatedAtIdx: index("idx_jobs_status_created_at").on(table.status, table.createdAt),
  statusPublicReleaseIdx: index("idx_jobs_status_public_release").on(table.status, table.publicReleaseAt),
  statusSubscriberReleaseIdx: index("idx_jobs_status_subscriber_release").on(table.status, table.subscriberReleaseAt),
}));

export const jobIngestRecords = pgTable(
  "job_ingest_records",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id").notNull().references(() => jobs.id),
    sourceSite: text("source_site").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    applyUrl: text("apply_url"),
    postedAt: timestamp("posted_at"),
    fingerprint: text("fingerprint").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    sourceExternalUnique: uniqueIndex("job_ingest_records_source_external_idx").on(
      table.sourceSite,
      table.externalId
    ),
    fingerprintUnique: uniqueIndex("job_ingest_records_fingerprint_idx").on(table.fingerprint),
  })
);

export const insertJobSchema = createInsertSchema(jobs).pick({
  juid: true,
  publicJobRef: true,
  title: true,
  description: true,
  location: true,
  countryCode: true,
  provinceCode: true,
  municipalityCode: true,
  locationCode: true,
  primaryCategoryCode: true,
  salary: true,
  jobType: true,
  workMode: true,
  companyId: true,
  categoryId: true,
  createdByUserId: true,
  status: true,
  riskStatus: true,
  applicationLinkStatus: true,
  verifiedAt: true,
  subscriberReleaseAt: true,
  memberReleaseAt: true,
  publicReleaseAt: true,
  expiresAt: true,
  releasePolicyVersion: true,
  isFeatured: true,
}).partial({
  juid: true,
  publicJobRef: true,
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
  createdBy: one(users, {
    fields: [jobs.createdByUserId],
    references: [users.id],
  }),
}));

export const jobIngestRecordsRelations = relations(jobIngestRecords, ({ one }) => ({
  job: one(jobs, {
    fields: [jobIngestRecords.jobId],
    references: [jobs.id],
  }),
}));

// SquareJUMP keeps every source occurrence separate from the canonical job.
export const jobSourceRecords = pgTable("job_source_records", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  sourceId: text("source_id").notNull(),
  externalJobId: text("external_job_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  applyUrl: text("apply_url"),
  sourcePublishedAt: timestamp("source_published_at"),
  firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  rawPayloadHash: text("raw_payload_hash"),
  normalisedPayloadHash: text("normalised_payload_hash").notNull(),
  exactFingerprint: text("exact_fingerprint").notNull(),
  contentFingerprint: text("content_fingerprint").notNull(),
  sourceReference: text("source_reference"),
  ingestStatus: text("ingest_status").notNull().default("accepted"),
  duplicateConfidence: integer("duplicate_confidence").notNull().default(0),
  metadata: jsonb("metadata"),
}, (table) => ({
  sourceExternalUnique: uniqueIndex("idx_job_source_records_source_external").on(
    table.sourceId,
    table.externalJobId,
  ),
  exactFingerprintIdx: index("idx_job_source_records_exact_fingerprint").on(table.exactFingerprint),
  contentFingerprintIdx: index("idx_job_source_records_content_fingerprint").on(table.contentFingerprint),
  jobIdx: index("idx_job_source_records_job").on(table.jobId),
}));

export const jobClassifications = pgTable("job_classifications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  primaryCategoryCode: text("primary_category_code").notNull(),
  secondaryCategoryCodes: jsonb("secondary_category_codes").notNull(),
  occupationCode: text("occupation_code"),
  taxonomyVersion: text("taxonomy_version").notNull(),
  classifierName: text("classifier_name").notNull(),
  classifierVersion: text("classifier_version").notNull(),
  confidence: integer("confidence").notNull(),
  classificationSource: text("classification_source").notNull(),
  status: text("status").notNull().default("accepted"),
  classifiedAt: timestamp("classified_at").notNull().defaultNow(),
}, (table) => ({
  jobTaxonomyUnique: uniqueIndex("idx_job_classifications_job_taxonomy").on(
    table.jobId,
    table.taxonomyVersion,
  ),
  categoryJobIdx: index("idx_job_classifications_category_job").on(
    table.primaryCategoryCode,
    table.jobId,
  ),
}));

export const jobRequirements = pgTable("job_requirements", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  requirementType: text("requirement_type").notNull(),
  code: text("code"),
  label: text("label").notNull(),
  necessity: text("necessity").notNull(),
  confidence: integer("confidence").notNull().default(100),
  source: text("source").notNull().default("rules"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  jobRequirementIdx: index("idx_job_requirements_job").on(table.jobId),
}));

export const scorePolicies = pgTable("score_policies", {
  id: serial("id").primaryKey(),
  policyType: text("policy_type").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"),
  weights: jsonb("weights").notNull(),
  thresholds: jsonb("thresholds").notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  activatedAt: timestamp("activated_at"),
  retiredAt: timestamp("retired_at"),
}, (table) => ({
  typeVersionUnique: uniqueIndex("idx_score_policies_type_version").on(
    table.policyType,
    table.version,
  ),
  activePolicyIdx: index("idx_score_policies_active").on(table.policyType, table.status),
}));

export const jobScores = pgTable("job_scores", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  scoreType: text("score_type").notNull(),
  scoreValue: integer("score_value").notNull(),
  componentScores: jsonb("component_scores").notNull(),
  penalties: jsonb("penalties").notNull(),
  policyVersion: text("policy_version").notNull(),
  featureSnapshot: jsonb("feature_snapshot").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
}, (table) => ({
  jobScoreTypeUnique: uniqueIndex("idx_job_scores_job_type").on(table.jobId, table.scoreType),
  opportunityRankIdx: index("idx_job_scores_rank").on(table.scoreType, table.scoreValue, table.calculatedAt),
}));

export const jobScoreHistory = pgTable("job_score_history", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  scoreType: text("score_type").notNull(),
  scoreValue: integer("score_value").notNull(),
  componentScores: jsonb("component_scores").notNull(),
  penalties: jsonb("penalties").notNull(),
  policyVersion: text("policy_version").notNull(),
  featureSnapshot: jsonb("feature_snapshot").notNull(),
  calculationReason: text("calculation_reason").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
}, (table) => ({
  jobHistoryIdx: index("idx_job_score_history_job_time").on(table.jobId, table.calculatedAt),
}));

export const userMatchProfiles = pgTable("user_match_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  preferredCategoryCodes: jsonb("preferred_category_codes").notNull(),
  preferredOccupationCodes: jsonb("preferred_occupation_codes").notNull(),
  preferredLocationCodes: jsonb("preferred_location_codes").notNull(),
  travelRadiusKm: integer("travel_radius_km").notNull().default(50),
  workModes: jsonb("work_modes").notNull(),
  employmentTypes: jsonb("employment_types").notNull(),
  minimumSalaryCents: integer("minimum_salary_cents"),
  skills: jsonb("skills").notNull(),
  qualifications: jsonb("qualifications").notNull(),
  licences: jsonb("licences").notNull(),
  certifications: jsonb("certifications").notNull(),
  behaviouralPersonalisationEnabled: boolean("behavioural_personalisation_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userJobMatches = pgTable("user_job_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  matchScore: integer("match_score").notNull(),
  placementScore: integer("placement_score").notNull(),
  componentScores: jsonb("component_scores").notNull(),
  reasons: jsonb("reasons").notNull(),
  missingRequirements: jsonb("missing_requirements").notNull(),
  policyVersion: text("policy_version").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
}, (table) => ({
  userJobUnique: uniqueIndex("idx_user_job_matches_user_job").on(table.userId, table.jobId),
  userPlacementIdx: index("idx_user_job_matches_user_placement").on(
    table.userId,
    table.placementScore,
  ),
}));

export const jobReleaseEvents = pgTable("job_release_events", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  audience: text("audience").notNull(),
  releaseAt: timestamp("release_at").notNull(),
  policyVersion: text("policy_version").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  status: text("status").notNull().default("scheduled"),
  attemptCount: integer("attempt_count").notNull().default(0),
  availableAt: timestamp("available_at"),
  lockedAt: timestamp("locked_at"),
  lastError: text("last_error"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  dueReleaseIdx: index("idx_job_release_events_due").on(table.status, table.releaseAt),
}));

export const notificationConsents = pgTable("notification_consents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  channel: text("channel").notNull(),
  consentStatus: text("consent_status").notNull(),
  notificationMode: text("notification_mode").notNull().default("in-app-only"),
  consentedAt: timestamp("consented_at"),
  consentSource: text("consent_source"),
  policyVersion: text("policy_version").notNull(),
  withdrawnAt: timestamp("withdrawn_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userChannelUnique: uniqueIndex("idx_notification_consents_user_channel").on(
    table.userId,
    table.channel,
  ),
}));

export const recommendationExposures = pgTable("recommendation_exposures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  trackingToken: text("tracking_token").notNull().unique(),
  surface: text("surface").notNull(),
  position: integer("position").notNull(),
  releaseStage: text("release_stage").notNull(),
  experimentKey: text("experiment_key"),
  exposedAt: timestamp("exposed_at").notNull().defaultNow(),
}, (table) => ({
  jobExposureIdx: index("idx_recommendation_exposures_job_time").on(table.jobId, table.exposedAt),
}));

export const jobEvents = pgTable("job_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  eventType: text("event_type").notNull(),
  trackingToken: text("tracking_token").notNull(),
  eventKey: text("event_key").notNull().unique(),
  durationSeconds: integer("duration_seconds"),
  metadata: jsonb("metadata").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (table) => ({
  jobTypeTimeIdx: index("idx_job_events_job_type_time").on(
    table.jobId,
    table.eventType,
    table.occurredAt,
  ),
}));

export const jobDuplicateCandidates = pgTable("job_duplicate_candidates", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  candidateJobId: integer("candidate_job_id").references(() => jobs.id),
  candidateSourceRecordId: integer("candidate_source_record_id").references(() => jobSourceRecords.id),
  confidence: integer("confidence").notNull(),
  evidence: jsonb("evidence").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pendingConfidenceIdx: index("idx_job_duplicate_candidates_pending").on(table.status, table.confidence),
}));

export const squareJumpAuditLog = pgTable("squarejump_audit_log", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  entityTimeIdx: index("idx_squarejump_audit_entity_time").on(
    table.entityType,
    table.entityId,
    table.createdAt,
  ),
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
}, (table) => ({
  jobTimeIdx: index("idx_user_interactions_job_time").on(table.jobId, table.interactionTime),
}));

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
}, (table) => ({
  userJobUnique: uniqueIndex("idx_job_applications_user_job_unique").on(table.userId, table.jobId),
  jobStatusIdx: index("idx_job_applications_job_status").on(table.jobId, table.status),
}));

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'job_match', 'status_update', etc.
  content: text("content").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
}, (table) => ({
  userReadCreatedIdx: index("idx_user_notifications_user_read_created").on(
    table.userId,
    table.isRead,
    table.createdAt
  ),
}));

export const userFavoriteJobs = pgTable("user_favorite_jobs", {
  userId: integer("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.jobId] }),
  userCreatedIdx: index("idx_user_favorite_jobs_user_created").on(table.userId, table.createdAt),
}));

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

export const squareJumpNotificationDeliveries = pgTable("squarejump_notification_deliveries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  channel: text("channel").notNull(),
  releaseStage: text("release_stage").notNull(),
  reason: text("reason").notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  status: text("status").notNull().default("queued"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastError: text("last_error"),
  queuedAt: timestamp("queued_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
}, (table) => ({
  userJobChannelIdx: index("idx_squarejump_notification_deliveries_user_job").on(
    table.userId,
    table.jobId,
    table.channel,
  ),
  statusQueuedIdx: index("idx_squarejump_notification_deliveries_status").on(
    table.status,
    table.queuedAt,
  ),
}));

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billingPlans = pgTable("billing_plans", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  currency: text("currency").notNull().default("ZAR"),
  billingInterval: text("billing_interval").notNull().default("month"),
  entitlements: jsonb("entitlements"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => billingPlans.id),
  provider: text("provider").notNull().default("payfast"),
  providerSubscriptionId: text("provider_subscription_id"),
  providerToken: text("provider_token"),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  gracePeriodEndsAt: timestamp("grace_period_ends_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  cancelledAt: timestamp("cancelled_at"),
  expiredAt: timestamp("expired_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userStatusIdx: index("idx_billing_subscriptions_user_status").on(table.userId, table.status),
  providerSubscriptionIdx: uniqueIndex("idx_billing_subscriptions_provider_subscription").on(
    table.provider,
    table.providerSubscriptionId,
  ),
}));

export const billingTransactions = pgTable("billing_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => billingPlans.id),
  subscriptionId: integer("subscription_id").references(() => billingSubscriptions.id),
  provider: text("provider").notNull().default("payfast"),
  providerPaymentId: text("provider_payment_id"),
  merchantReference: text("merchant_reference").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("ZAR"),
  status: text("status").notNull().default("pending"),
  paymentType: text("payment_type").notNull().default("subscription"),
  checkoutUrl: text("checkout_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCreatedIdx: index("idx_billing_transactions_user_created").on(table.userId, table.createdAt),
  providerPaymentIdx: index("idx_billing_transactions_provider_payment").on(table.provider, table.providerPaymentId),
}));

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().default("payfast"),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload"),
  verified: boolean("verified").notNull().default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  providerEventUnique: uniqueIndex("idx_billing_webhook_events_provider_event").on(table.provider, table.eventId),
}));

export const aiUsageEvents = pgTable("ai_usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  model: text("model"),
  tokens: integer("tokens").notNull().default(0),
  costEstimateCents: integer("cost_estimate_cents").notNull().default(0),
  generationTimeMs: integer("generation_time_ms").notNull().default(0),
  success: boolean("success").notNull().default(false),
  status: text("status").notNull().default("started"),
  idempotencyKey: text("idempotency_key").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userDocumentIdx: index("idx_ai_usage_events_user_document").on(table.userId, table.documentType),
  userIdempotencyUnique: uniqueIndex("idx_ai_usage_events_user_idempotency").on(table.userId, table.idempotencyKey),
}));

export const aiGeneratedDocuments = pgTable("ai_generated_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  usageEventId: integer("usage_event_id").references(() => aiUsageEvents.id),
  documentType: text("document_type").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  title: text("title"),
  content: jsonb("content").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const candidatePromotionState = pgTable("candidate_promotion_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  boostScore: integer("boost_score").notNull().default(0),
  visibilityMultiplier: integer("visibility_multiplier").notNull().default(100),
  profileStrength: integer("profile_strength").notNull().default(0),
  active: boolean("active").notNull().default(false),
  source: text("source").notNull().default("system"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const proInterest = pgTable("pro_interest", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  source: text("source").notNull().default("plus_page"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  emailUnique: uniqueIndex("idx_pro_interest_email").on(table.email),
}));

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
