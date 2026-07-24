import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  companies, type Company, type InsertCompany,
  jobs, type Job, type InsertJob,
  jobIngestRecords, type JobIngestRecord, type InsertJobIngestRecord,
  userFavoriteJobs, type UserFavoriteJob,
  files, type File, type InsertFile,
  jobApplications, type JobApplication, type InsertJobApplication,
  userInteractions, type UserInteraction, type InsertUserInteraction,
  userNotifications, type UserNotification, type InsertUserNotification,
  type JobWithCompany
} from "@shared/schema";
import { db, getSqliteConnection, isSqliteDatabase } from "./db";
import { eq, like, or, desc, and, count, inArray, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Categories methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Companies methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompaniesWithHiringMetrics(): Promise<any[]>;
  updateCompanyHiringMetrics(companyId: number, metrics: any): Promise<boolean>;
  getHiringTrends(): Promise<any>;

  // Jobs methods
  getJobs(): Promise<Job[]>;
  getJobsWithCompanies(): Promise<JobWithCompany[]>;
  getFeaturedJobs(): Promise<JobWithCompany[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByCompany(companyId: number): Promise<Job[]>;
  getJobsByCategory(categoryId: number): Promise<Job[]>;
  searchJobs(query: string): Promise<JobWithCompany[]>;
  createJob(job: InsertJob): Promise<Job>;
  getJobIngestRecordBySource(sourceSite: string, externalId: string): Promise<JobIngestRecord | undefined>;
  getJobIngestRecordByFingerprint(fingerprint: string): Promise<JobIngestRecord | undefined>;
  createJobIngestRecord(record: InsertJobIngestRecord): Promise<JobIngestRecord>;
  getUserFavoriteJobs(userId: number, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ jobs: JobWithCompany[]; total: number }>;
  isJobFavorited(userId: number, jobId: number): Promise<boolean>;
  addJobToFavorites(userId: number, jobId: number): Promise<UserFavoriteJob>;
  removeJobFromFavorites(userId: number, jobId: number): Promise<boolean>;
  getUserFavoriteJobsCount(userId: number): Promise<number>;

  // Files methods
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  getFilesByType(fileType: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;

  // Job Application methods
  createJobApplication(application: Omit<InsertJobApplication, 'id' | 'appliedAt' | 'updatedAt'>): Promise<JobApplication>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getJobApplicationByUserAndJob(userId: number, jobId: number): Promise<JobApplication | undefined>;
  getJobApplicationsByUser(userId: number, options: {
    page: number;
    limit: number;
    status?: string;
    jobId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ applications: JobApplication[]; total: number }>;
  getJobApplicationsByJob(jobId: number, options: {
    page: number;
    limit: number;
    status?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ applications: JobApplication[]; total: number }>;
  updateJobApplication(id: number, updates: Partial<Omit<JobApplication, 'id' | 'userId' | 'jobId' | 'appliedAt'>>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<boolean>;

  // User Interaction methods
  createUserInteraction(interaction: Omit<InsertUserInteraction, 'id'>): Promise<UserInteraction>;
  
  // User Notification methods
  createUserNotification(notification: Omit<InsertUserNotification, 'id' | 'createdAt'>): Promise<UserNotification>;

  // Profile methods
  getUserProfile(userId: number): Promise<any>;
  getUserProfileByFirebaseUid(uid: string): Promise<any>;
  updateUserProfile(userId: number, profileData: any): Promise<any>;
  createUserProfile(userId: number, profileData: any): Promise<any>;

  // Initialize database with sample data (optional)
  initializeData(): Promise<void>;
}

import { ApiError, Errors, ErrorType } from './middleware/errorHandler';
import {
  createJuid,
  createOrganisationUid,
  createPublicJobRef,
} from './services/squarejump/identityService';

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function profileSection(value: unknown, fallback: Record<string, any>) {
  return {
    ...fallback,
    ...asRecord(value),
  };
}

function mergeProfileSection(current: unknown, updates: unknown) {
  return {
    ...asRecord(current),
    ...asRecord(updates),
  };
}

function extractSkillArray(skills: unknown): string[] {
  if (Array.isArray(skills)) {
    return skills.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0);
  }

  const skillsRecord = asRecord(skills);
  if (Array.isArray(skillsRecord.skills)) {
    return skillsRecord.skills.filter((skill: unknown): skill is string => typeof skill === 'string' && skill.trim().length > 0);
  }

  return [];
}

export class DatabaseStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error: any) {
      throw Errors.database(`Failed to get user by ID: ${error.message}`, error);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error: any) {
      throw Errors.database(`Failed to get user by username: ${error.message}`, error);
    }
  }

  async getUserByFirebaseUid(uid: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.firebaseUid, uid));
      return user;
    } catch (error: any) {
      throw Errors.database(`Failed to get user by Firebase UID: ${error.message}`, error);
    }
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error: any) {
      throw Errors.database(`Failed to get user by ID: ${error.message}`, error);
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error: any) {
      throw Errors.database(`Failed to get users: ${error.message}`, error);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') { // SQLite and PostgreSQL unique violation
        throw Errors.conflict(`User with username '${insertUser.username}' already exists.`);
      }
      throw Errors.database(`Failed to create user: ${error.message}`, error);
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        throw Errors.conflict(`User with username '${updates.username}' already exists.`);
      }
      throw Errors.database(`Failed to update user: ${error.message}`, error);
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.count > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete user: ${error.message}`, error);
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error: any) {
      throw Errors.database(`Failed to get categories: ${error.message}`, error);
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error: any) {
      throw Errors.database(`Failed to get category by ID: ${error.message}`, error);
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
      return category;
    } catch (error: any) {
      throw Errors.database(`Failed to get category by slug: ${error.message}`, error);
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      const [category] = await db.insert(categories).values(insertCategory).returning();
      return category;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        throw Errors.conflict(`Category with slug '${insertCategory.slug}' already exists.`);
      }
      throw Errors.database(`Failed to create category: ${error.message}`, error);
    }
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    try {
      return await db.select().from(companies);
    } catch (error: any) {
      throw Errors.database(`Failed to get companies: ${error.message}`, error);
    }
  }

  async getCompany(id: number): Promise<Company | undefined> {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.id, id));
      return company;
    } catch (error: any) {
      throw Errors.database(`Failed to get company by ID: ${error.message}`, error);
    }
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
      return company;
    } catch (error: any) {
      throw Errors.database(`Failed to get company by slug: ${error.message}`, error);
    }
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    try {
      const [company] = await db.insert(companies).values({
        ...insertCompany,
        organisationUid: insertCompany.organisationUid ?? createOrganisationUid(),
      }).returning();
      return company;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        throw Errors.conflict(`Company with slug '${insertCompany.slug}' already exists.`);
      }
      throw Errors.database(`Failed to create company: ${error.message}`, error);
    }
  }

  // Job methods
  async getJobs(): Promise<Job[]> {
    try {
      return await db.select().from(jobs);
    } catch (error: any) {
      throw Errors.database(`Failed to get jobs: ${error.message}`, error);
    }
  }

  async getJobsWithCompanies(): Promise<JobWithCompany[]> {
    try {
      // Use the included relations to join with companies
      const jobsWithCompanies = await db.query.jobs.findMany({
        with: {
          company: true
        },
        orderBy: [desc(jobs.createdAt)]
      });

      return jobsWithCompanies as JobWithCompany[];
    } catch (error: any) {
      throw Errors.database(`Failed to get jobs with companies: ${error.message}`, error);
    }
  }

  async getFeaturedJobs(): Promise<JobWithCompany[]> {
    try {
      const featuredJobs = await db.query.jobs.findMany({
        with: {
          company: true
        },
        where: eq(jobs.isFeatured, true),
        orderBy: [desc(jobs.createdAt)]
      });

      return featuredJobs as JobWithCompany[];
    } catch (error: any) {
      throw Errors.database(`Failed to get featured jobs: ${error.message}`, error);
    }
  }

  async getJob(id: number): Promise<Job | undefined> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
      return job;
    } catch (error: any) {
      throw Errors.database(`Failed to get job by ID: ${error.message}`, error);
    }
  }

  async getJobsByCompany(companyId: number): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.companyId, companyId));
    } catch (error: any) {
      throw Errors.database(`Failed to get jobs by company: ${error.message}`, error);
    }
  }

  async getJobsByCategory(categoryId: number): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.categoryId, categoryId));
    } catch (error: any) {
      throw Errors.database(`Failed to get jobs by category: ${error.message}`, error);
    }
  }

  async searchJobs(query: string): Promise<JobWithCompany[]> {
    try {
      if (!query || query.trim() === '') {
        return await this.getJobsWithCompanies();
      }

      const searchQuery = `%${query.toLowerCase()}%`;

      const searchResults = await db.query.jobs.findMany({
        with: {
          company: true
        },
        where: or(
          like(jobs.title, searchQuery),
          like(jobs.description, searchQuery)
        ),
        orderBy: [desc(jobs.createdAt)]
      });

      return searchResults as JobWithCompany[];
    } catch (error: any) {
      throw Errors.database(`Failed to search jobs: ${error.message}`, error);
    }
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    try {
      const identity = {
        juid: insertJob.juid ?? createJuid(),
        publicJobRef: insertJob.publicJobRef ?? createPublicJobRef({
          provinceCode: insertJob.provinceCode,
          categoryCode: insertJob.primaryCategoryCode,
        }),
      };
      if (isSqliteDatabase()) {
        const sqlite = getSqliteConnection();
        const createdAt = new Date().toISOString();
        const result = sqlite
          .prepare(
            `INSERT INTO jobs (
              juid, public_job_ref, title, description, location, country_code,
              province_code, municipality_code, location_code, primary_category_code,
              salary, job_type, work_mode, company_id, category_id, created_by_user_id,
              status, risk_status, application_link_status, verified_at,
              subscriber_release_at, member_release_at, public_release_at, expires_at,
              release_policy_version, is_featured, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            identity.juid,
            identity.publicJobRef,
            insertJob.title,
            insertJob.description,
            insertJob.location,
            insertJob.countryCode ?? "ZA",
            insertJob.provinceCode ?? null,
            insertJob.municipalityCode ?? null,
            insertJob.locationCode ?? null,
            insertJob.primaryCategoryCode ?? null,
            insertJob.salary ?? null,
            insertJob.jobType,
            insertJob.workMode,
            insertJob.companyId,
            insertJob.categoryId,
            insertJob.createdByUserId ?? null,
            insertJob.status ?? "active",
            insertJob.riskStatus ?? "clear",
            insertJob.applicationLinkStatus ?? "unverified",
            insertJob.verifiedAt?.toISOString() ?? null,
            insertJob.subscriberReleaseAt?.toISOString() ?? null,
            insertJob.memberReleaseAt?.toISOString() ?? null,
            insertJob.publicReleaseAt?.toISOString() ?? null,
            insertJob.expiresAt?.toISOString() ?? null,
            insertJob.releasePolicyVersion ?? null,
            insertJob.isFeatured ? 1 : 0,
            createdAt
          );

        const row = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(result.lastInsertRowid);
        return {
          id: Number(row.id),
          juid: row.juid,
          publicJobRef: row.public_job_ref,
          title: row.title,
          description: row.description,
          location: row.location,
          countryCode: row.country_code,
          provinceCode: row.province_code,
          municipalityCode: row.municipality_code,
          locationCode: row.location_code,
          primaryCategoryCode: row.primary_category_code,
          salary: row.salary,
          jobType: row.job_type,
          workMode: row.work_mode,
          companyId: row.company_id,
          categoryId: row.category_id,
          createdByUserId: row.created_by_user_id,
          status: row.status,
          riskStatus: row.risk_status,
          applicationLinkStatus: row.application_link_status,
          verifiedAt: row.verified_at,
          subscriberReleaseAt: row.subscriber_release_at,
          memberReleaseAt: row.member_release_at,
          publicReleaseAt: row.public_release_at,
          expiresAt: row.expires_at,
          releasePolicyVersion: row.release_policy_version,
          isFeatured: Boolean(row.is_featured),
          createdAt: row.created_at,
        } as Job;
      }

      const [job] = await db
        .insert(jobs)
        .values({
          ...insertJob,
          ...identity,
          createdAt: new Date(),
        })
        .returning();
      return job;
    } catch (error: any) {
      throw Errors.database(`Failed to create job: ${error.message}`, error);
    }
  }

  async getJobIngestRecordBySource(
    sourceSite: string,
    externalId: string
  ): Promise<JobIngestRecord | undefined> {
    try {
      const [record] = await db
        .select()
        .from(jobIngestRecords)
        .where(and(eq(jobIngestRecords.sourceSite, sourceSite), eq(jobIngestRecords.externalId, externalId)));
      return record;
    } catch (error: any) {
      throw Errors.database(`Failed to get job ingest record by source: ${error.message}`, error);
    }
  }

  async getJobIngestRecordByFingerprint(fingerprint: string): Promise<JobIngestRecord | undefined> {
    try {
      const [record] = await db
        .select()
        .from(jobIngestRecords)
        .where(eq(jobIngestRecords.fingerprint, fingerprint));
      return record;
    } catch (error: any) {
      throw Errors.database(`Failed to get job ingest record by fingerprint: ${error.message}`, error);
    }
  }

  async createJobIngestRecord(insertRecord: InsertJobIngestRecord): Promise<JobIngestRecord> {
    try {
      if (isSqliteDatabase()) {
        const sqlite = getSqliteConnection();
        const createdAt =
          insertRecord.createdAt instanceof Date
            ? insertRecord.createdAt.toISOString()
            : insertRecord.createdAt ?? new Date().toISOString();
        const updatedAt =
          insertRecord.updatedAt instanceof Date
            ? insertRecord.updatedAt.toISOString()
            : insertRecord.updatedAt ?? new Date().toISOString();
        const postedAt =
          insertRecord.postedAt instanceof Date
            ? insertRecord.postedAt.toISOString()
            : insertRecord.postedAt ?? null;
        const metadata =
          insertRecord.metadata && typeof insertRecord.metadata !== 'string'
            ? JSON.stringify(insertRecord.metadata)
            : insertRecord.metadata ?? null;

        const result = sqlite
          .prepare(
            `INSERT INTO job_ingest_records (
              job_id, source_site, source_url, external_id, apply_url, posted_at, fingerprint, metadata, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            insertRecord.jobId,
            insertRecord.sourceSite,
            insertRecord.sourceUrl,
            insertRecord.externalId,
            insertRecord.applyUrl ?? null,
            postedAt,
            insertRecord.fingerprint,
            metadata,
            createdAt,
            updatedAt
          );

        const row = sqlite
          .prepare(`SELECT * FROM job_ingest_records WHERE id = ?`)
          .get(result.lastInsertRowid);
        return {
          id: Number(row.id),
          jobId: row.job_id,
          sourceSite: row.source_site,
          sourceUrl: row.source_url,
          externalId: row.external_id,
          applyUrl: row.apply_url,
          postedAt: row.posted_at,
          fingerprint: row.fingerprint,
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as JobIngestRecord;
      }

      const [record] = await db
        .insert(jobIngestRecords)
        .values({
          ...insertRecord,
          postedAt: insertRecord.postedAt instanceof Date
            ? insertRecord.postedAt.toISOString()
            : insertRecord.postedAt ?? null,
          metadata:
            insertRecord.metadata && typeof insertRecord.metadata !== 'string'
              ? JSON.stringify(insertRecord.metadata)
              : insertRecord.metadata ?? null,
          createdAt:
            insertRecord.createdAt instanceof Date
              ? insertRecord.createdAt.toISOString()
              : insertRecord.createdAt ?? new Date().toISOString(),
          updatedAt:
            insertRecord.updatedAt instanceof Date
              ? insertRecord.updatedAt.toISOString()
              : insertRecord.updatedAt ?? new Date().toISOString(),
        })
        .returning();
      return record;
    } catch (error: any) {
      throw Errors.database(`Failed to create job ingest record: ${error.message}`, error);
    }
  }

  async getUserFavoriteJobs(
    userId: number,
    options: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<{ jobs: JobWithCompany[]; total: number }> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const favoriteRows = await db
        .select()
        .from(userFavoriteJobs)
        .where(eq(userFavoriteJobs.userId, userId))
        .orderBy(sortOrder === 'asc' ? asc(userFavoriteJobs.createdAt) : desc(userFavoriteJobs.createdAt));

      if (favoriteRows.length === 0) {
        return { jobs: [], total: 0 };
      }

      const jobIds = favoriteRows.map((row) => row.jobId);
      const favoriteJobs = await db.query.jobs.findMany({
        with: { company: true },
        where: inArray(jobs.id, jobIds),
      });

      const favoriteCreatedAtByJobId = new Map(
        favoriteRows.map((row) => [row.jobId, row.createdAt ? new Date(row.createdAt).getTime() : 0]),
      );

      const sortedJobs = [...(favoriteJobs as JobWithCompany[])].sort((left, right) => {
        if (sortBy === 'jobTitle') {
          return sortOrder === 'asc'
            ? left.title.localeCompare(right.title)
            : right.title.localeCompare(left.title);
        }

        if (sortBy === 'company') {
          return sortOrder === 'asc'
            ? left.company.name.localeCompare(right.company.name)
            : right.company.name.localeCompare(left.company.name);
        }

        if (sortBy === 'salary') {
          const leftSalary = left.salary ?? '';
          const rightSalary = right.salary ?? '';
          return sortOrder === 'asc'
            ? leftSalary.localeCompare(rightSalary)
            : rightSalary.localeCompare(leftSalary);
        }

        const leftCreatedAt = Number(favoriteCreatedAtByJobId.get(left.id) ?? 0);
        const rightCreatedAt = Number(favoriteCreatedAtByJobId.get(right.id) ?? 0);
        return sortOrder === 'asc' ? leftCreatedAt - rightCreatedAt : rightCreatedAt - leftCreatedAt;
      });

      const offset = (page - 1) * limit;
      return {
        jobs: sortedJobs.slice(offset, offset + limit),
        total: sortedJobs.length,
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user favorite jobs: ${error.message}`, error);
    }
  }

  async isJobFavorited(userId: number, jobId: number): Promise<boolean> {
    try {
      const [favorite] = await db
        .select()
        .from(userFavoriteJobs)
        .where(and(eq(userFavoriteJobs.userId, userId), eq(userFavoriteJobs.jobId, jobId)));
      return Boolean(favorite);
    } catch (error: any) {
      throw Errors.database(`Failed to check favorite job state: ${error.message}`, error);
    }
  }

  async addJobToFavorites(userId: number, jobId: number): Promise<UserFavoriteJob> {
    try {
      const [favorite] = await db
        .insert(userFavoriteJobs)
        .values({
          userId,
          jobId,
          createdAt: new Date(),
        })
        .returning();
      return favorite;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        const [favorite] = await db
          .select()
          .from(userFavoriteJobs)
          .where(and(eq(userFavoriteJobs.userId, userId), eq(userFavoriteJobs.jobId, jobId)));
        if (favorite) {
          return favorite;
        }
      }
      throw Errors.database(`Failed to add job to favorites: ${error.message}`, error);
    }
  }

  async removeJobFromFavorites(userId: number, jobId: number): Promise<boolean> {
    try {
      if (isSqliteDatabase()) {
        const sqlite = getSqliteConnection();
        const result = sqlite
          .prepare(`DELETE FROM user_favorite_jobs WHERE user_id = ? AND job_id = ?`)
          .run(userId, jobId);
        return result.changes > 0;
      }

      const result = await db
        .delete(userFavoriteJobs)
        .where(and(eq(userFavoriteJobs.userId, userId), eq(userFavoriteJobs.jobId, jobId)));
      return result.count > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to remove job from favorites: ${error.message}`, error);
    }
  }

  async getUserFavoriteJobsCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(userFavoriteJobs)
        .where(eq(userFavoriteJobs.userId, userId));
      return Number(result?.count ?? 0);
    } catch (error: any) {
      throw Errors.database(`Failed to count favorite jobs: ${error.message}`, error);
    }
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    try {
      const [file] = await db.select().from(files).where(eq(files.id, id));
      return file;
    } catch (error: any) {
      throw Errors.database(`Failed to get file by ID: ${error.message}`, error);
    }
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    try {
      return await db.select().from(files).where(eq(files.userId, userId));
    } catch (error: any) {
      throw Errors.database(`Failed to get files by user: ${error.message}`, error);
    }
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    try {
      return await db.select().from(files).where(eq(files.fileType, fileType));
    } catch (error: any) {
      throw Errors.database(`Failed to get files by type: ${error.message}`, error);
    }
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    try {
      const [file] = await db.insert(files).values(insertFile).returning();
      return file;
    } catch (error: any) {
      throw Errors.database(`Failed to create file: ${error.message}`, error);
    }
  }

  async deleteFile(id: number): Promise<boolean> {
    try {
      const result = await db.delete(files).where(eq(files.id, id));
      return result.count > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete file: ${error.message}`, error);
    }
  }

  // Job Application methods
  async createJobApplication(application: Omit<InsertJobApplication, 'id' | 'appliedAt' | 'updatedAt'>): Promise<JobApplication> {
    try {
      const [jobApplication] = await db.insert(jobApplications).values({
        ...application,
        appliedAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return jobApplication;
    } catch (error: any) {
      throw Errors.database(`Failed to create job application: ${error.message}`, error);
    }
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    try {
      const [application] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      return application;
    } catch (error: any) {
      throw Errors.database(`Failed to get job application by ID: ${error.message}`, error);
    }
  }

  async getJobApplicationByUserAndJob(userId: number, jobId: number): Promise<JobApplication | undefined> {
    try {
      const [application] = await db.select().from(jobApplications)
        .where(and(eq(jobApplications.userId, userId), eq(jobApplications.jobId, jobId)));
      return application;
    } catch (error: any) {
      throw Errors.database(`Failed to get job application by user and job: ${error.message}`, error);
    }
  }

  async getJobApplicationsByUser(userId: number, options: {
    page: number;
    limit: number;
    status?: string;
    jobId?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ applications: JobApplication[]; total: number }> {
    try {
      const { page, limit, status, jobId, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(jobApplications.userId, userId)];
      if (status) {
        conditions.push(eq(jobApplications.status, status));
      }
      if (jobId) {
        conditions.push(eq(jobApplications.jobId, jobId));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(jobApplications)
        .where(whereClause);
      const total = totalResult.count;

      // Get applications with sorting
      const sortColumn = (jobApplications as Record<string, any>)[sortBy] ?? jobApplications.appliedAt;
      const orderByClause = sortOrder === 'desc' ? desc(sortColumn) : sortColumn;

      const applications = await db.select()
        .from(jobApplications)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return { applications, total };
    } catch (error: any) {
      throw Errors.database(`Failed to get job applications by user: ${error.message}`, error);
    }
  }

  async getJobApplicationsByJob(jobId: number, options: {
    page: number;
    limit: number;
    status?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ applications: JobApplication[]; total: number }> {
    try {
      const { page, limit, status, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(jobApplications.jobId, jobId)];
      if (status) {
        conditions.push(eq(jobApplications.status, status));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(jobApplications)
        .where(whereClause);
      const total = totalResult.count;

      // Get applications with sorting
      const sortColumn = (jobApplications as Record<string, any>)[sortBy] ?? jobApplications.appliedAt;
      const orderByClause = sortOrder === 'desc' ? desc(sortColumn) : sortColumn;

      const applications = await db.select()
        .from(jobApplications)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return { applications, total };
    } catch (error: any) {
      throw Errors.database(`Failed to get job applications by job: ${error.message}`, error);
    }
  }

  async updateJobApplication(id: number, updates: Partial<Omit<JobApplication, 'id' | 'userId' | 'jobId' | 'appliedAt'>>): Promise<JobApplication> {
    try {
      const [updatedApplication] = await db.update(jobApplications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(jobApplications.id, id))
        .returning();
      return updatedApplication;
    } catch (error: any) {
      throw Errors.database(`Failed to update job application: ${error.message}`, error);
    }
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobApplications).where(eq(jobApplications.id, id));
      return result.count > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete job application: ${error.message}`, error);
    }
  }

  // User Interaction methods
  async createUserInteraction(interaction: Omit<InsertUserInteraction, 'id'>): Promise<UserInteraction> {
    try {
      const [userInteraction] = await db.insert(userInteractions).values(interaction).returning();
      return userInteraction;
    } catch (error: any) {
      throw Errors.database(`Failed to create user interaction: ${error.message}`, error);
    }
  }

  // User Notification methods
  async createUserNotification(notification: Omit<InsertUserNotification, 'id' | 'createdAt'>): Promise<UserNotification> {
    try {
      const [userNotification] = await db.insert(userNotifications).values({
        ...notification,
        createdAt: new Date(),
      }).returning();
      return userNotification;
    } catch (error: any) {
      throw Errors.database(`Failed to create user notification: ${error.message}`, error);
    }
  }

  // Profile methods
  async getUserProfile(userId: number): Promise<any> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return null;
      }

      // Get user files
      const userFiles = await this.getFilesByUser(userId);
      const profileImage = userFiles.find(f => f.fileType === 'profile_image');
      const professionalImage = userFiles.find(f => f.fileType === 'professional_image');
      const cvFile = userFiles.find(f => f.fileType === 'cv');

      const education = profileSection(user.education, {
        highestEducation: "",
        schoolName: "",
        yearCompleted: "",
        achievements: "",
        additionalCourses: "",
      });
      const experience = profileSection(user.experience, {
        hasExperience: false,
        currentlyEmployed: false,
        jobTitle: "",
        employer: "",
        startDate: "",
        endDate: "",
        jobDescription: "",
        previousExperience: "",
        volunteerWork: "",
        references: "",
      });
      const skills = profileSection(user.skills, {
        skills: extractSkillArray(user.skills),
        customSkills: "",
        languages: ["English"],
        hasDriversLicense: false,
        hasTransport: false,
        cvUpload: cvFile?.fileUrl,
      });
      const preferences = profileSection(user.preferences, {
        jobTypes: [],
        locations: [],
        minSalary: 0,
        willingToRelocate: user.willingToRelocate || false,
      });

      return {
        userId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        personal: {
          fullName: user.name || user.username,
          phoneNumber: user.phoneNumber || "",
          location: user.location || "",
          bio: user.bio || "",
          profilePicture: profileImage?.fileUrl,
          professionalImage: professionalImage?.fileUrl,
        },
        education,
        experience,
        skills: {
          ...skills,
          cvUpload: skills.cvUpload || cvFile?.fileUrl,
        },
        preferences,
        // Additional profile metadata
        memberSince: user.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        engagementScore: user.engagementScore || 0,
        applications: {
          current: 0,
          total: 0,
          successRate: 0,
        },
        ratings: {
          overall: 0,
        },
        notifications: 0,
        recentActivity: [],
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user profile: ${error.message}`, error);
    }
  }

  async getUserProfileByFirebaseUid(uid: string): Promise<any> {
    const user = await this.getUserByFirebaseUid(uid);
    if (!user) return null;
    return this.getUserProfile(user.id);
  }

  async updateUserProfile(userId: number, profileData: any): Promise<any> {
    try {
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) {
        throw Errors.notFound('User not found');
      }

      const personal = mergeProfileSection(currentProfile.personal, profileData.personal);
      const education = mergeProfileSection(currentProfile.education, profileData.education);
      const experience = mergeProfileSection(currentProfile.experience, profileData.experience);
      const skills = mergeProfileSection(currentProfile.skills, profileData.skills);
      const preferences = mergeProfileSection(currentProfile.preferences, profileData.preferences);

      const updatedUser = await this.updateUser(userId, {
        name: personal.fullName || currentProfile.personal.fullName,
        phoneNumber: personal.phoneNumber || null,
        location: personal.location || null,
        bio: personal.bio || null,
        education,
        experience,
        skills,
        preferences,
        willingToRelocate: Boolean(preferences.willingToRelocate),
      } as Partial<InsertUser>);

      if (!updatedUser) {
        throw Errors.notFound('User not found');
      }

      return await this.getUserProfile(userId);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.database(`Failed to update user profile: ${error.message}`, error);
    }
  }

  async createUserProfile(userId: number, profileData: any): Promise<any> {
    try {
      // In a real implementation, this would create a new profile record
      return await this.updateUserProfile(userId, profileData);
    } catch (error: any) {
      throw Errors.database(`Failed to create user profile: ${error.message}`, error);
    }
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
    try {
      // Check if database already has data
      const existingCategories = await db.select().from(categories);
      if (existingCategories.length > 0) {
        return; // Database already has data
      }

      // Add categories for entry-level jobs
      const categoryIcons = ['shopping-cart', 'user', 'shield', 'gas-pump', 'baby', 'broom', 'seedling'];
      const categoryNames = ['Retail', 'General Worker', 'Security', 'Petrol Attendant', 'Childcare', 'Cleaning', 'Landscaping'];
      const categorySlugs = ['retail', 'general-worker', 'security', 'petrol-attendant', 'childcare', 'cleaning', 'landscaping'];
      const categoryJobCounts = [350, 420, 280, 190, 230, 310, 175];

      // Create categories
      const createdCategories = [] as Category[];
      for (let i = 0; i < categoryNames.length; i++) {
        const category = await this.createCategory({
          name: categoryNames[i],
          icon: categoryIcons[i],
          slug: categorySlugs[i],
          jobCount: categoryJobCounts[i],
        });
        createdCategories.push(category);
      }

      // Add companies hiring for entry-level jobs
      const companyNames = ['Shoprite', 'Pick n Pay', 'Securitas', 'Engen', 'Sasol', 'Checkers', 'Spar'];
      const companyLocations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Soweto', 'Port Elizabeth', 'Bloemfontein'];
      const companySlugs = ['shoprite', 'pick-n-pay', 'securitas', 'engen', 'sasol', 'checkers', 'spar'];
      const companyOpenPositions = [45, 38, 52, 29, 31, 42, 33];
      const companyLogos = Array(7).fill('default-logo.svg');

      // Create companies
      const createdCompanies = [] as Company[];
      for (let i = 0; i < companyNames.length; i++) {
        const company = await this.createCompany({
          name: companyNames[i],
          logo: companyLogos[i],
          location: companyLocations[i],
          slug: companySlugs[i],
          openPositions: companyOpenPositions[i],
        });
        createdCompanies.push(company);
      }

      // Add featured jobs focused on entry-level positions
      const jobTitles = [
        'Cashier',
        'General Worker',
        'Security Guard',
        'Petrol Attendant',
        'Domestic Worker',
        'Cleaner',
        'Gardener/Landscaper'
      ];

      const jobDescriptions = [
        'We are looking for reliable and friendly cashiers to join our team. Responsibilities include operating the till, handling cash, and providing excellent customer service.',
        'General workers needed for warehouse operations. Duties include loading/unloading goods, organizing stock, and general maintenance tasks.',
        'Security personnel required for retail mall. Must have valid security certification and be willing to work shifts.',
        'Petrol attendants needed for busy service station. Responsibilities include fueling vehicles, checking oil/water levels, and basic customer service.',
        'Seeking reliable domestic workers for housekeeping duties including cleaning, laundry, and basic cooking.',
        'Commercial cleaners required for office buildings. Morning and evening shifts available.',
        'Experienced gardeners needed for residential properties. Duties include lawn maintenance, plant care, and general outdoor upkeep.'
      ];

      const jobTypes = ['Full-time', 'Full-time', 'Shift Work', 'Shift Work', 'Full-time', 'Part-time', 'Full-time'];
      const workModes = ['On-site', 'On-site', 'On-site', 'On-site', 'On-site', 'On-site', 'On-site'];
      const salaries = [
        'R5,000 - R7,000/month',
        'R5,500 - R8,000/month',
        'R6,000 - R9,000/month',
        'R5,500 - R7,500/month',
        'R4,500 - R7,000/month',
        'R4,000 - R6,000/month',
        'R5,000 - R8,000/month'
      ];

      // Create jobs
      for (let i = 0; i < jobTitles.length; i++) {
        await this.createJob({
          title: jobTitles[i],
          description: jobDescriptions[i],
          location: companyLocations[i],
          salary: salaries[i],
          jobType: jobTypes[i],
          workMode: workModes[i],
          companyId: createdCompanies[i].id,
          categoryId: createdCategories[i].id,
          isFeatured: true,
        });
      }
    } catch (error: any) {
      throw Errors.database(`Failed to initialize data: ${error.message}`, error);
    }
  }
}

// Import Firestore implementation
import { FirestoreStorage } from './firestore-storage';

// Create an instance of the PostgreSQL storage
export const storage = new DatabaseStorage();

// Comment out the Firestore implementation for reference
// export const storage = new FirestoreStorage();

// Export the storage classes for direct use in other files
// export { DatabaseStorage, FirestoreStorage };
