import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  companies, type Company, type InsertCompany,
  jobs, type Job, type InsertJob,
  files, type File, type InsertFile,
  jobApplications, type JobApplication, type InsertJobApplication,
  userInteractions, type UserInteraction, type InsertUserInteraction,
  userNotifications, type UserNotification, type InsertUserNotification,
  type JobWithCompany
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc, and, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
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
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  searchJobs(query: string): Promise<JobWithCompany[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

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
  getJobApplications(options: {
    page: number;
    limit: number;
    status?: string;
    jobIds?: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: JobApplication[]; pagination: any }>;
  updateJobApplication(id: number, updates: Partial<Omit<JobApplication, 'id' | 'userId' | 'jobId' | 'appliedAt'>>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<boolean>;

  // User Interaction methods
  createUserInteraction(interaction: Omit<InsertUserInteraction, 'id'>): Promise<UserInteraction>;
  
  // User Notification methods
  createUserNotification(notification: Omit<InsertUserNotification, 'id' | 'createdAt'>): Promise<UserNotification>;
  getUserNotifications(userId: number, options: {
    page: number;
    limit: number;
    type?: string;
    isRead?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: UserNotification[]; pagination: any }>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<UserNotification | undefined>;
  markAllNotificationsAsRead(userId: number, type?: string): Promise<number>;
  getNotificationSettings(userId: number): Promise<any>;
  updateNotificationSettings(userId: number, settings: any): Promise<any>;
  deleteNotification(notificationId: number, userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Job Favorites methods
  addJobFavorite(userId: number, jobId: number): Promise<any>;
  removeJobFavorite(userId: number, jobId: number): Promise<boolean>;
  getJobFavorite(userId: number, jobId: number): Promise<any>;
  getUserJobFavorites(userId: number, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination: any }>;

  // Profile methods
  getUserProfile(userId: number): Promise<any>;
  updateUserProfile(userId: number, profileData: any): Promise<any>;
  createUserProfile(userId: number, profileData: any): Promise<any>;

  // Initialize database with sample data (optional)
  initializeData(): Promise<void>;

  // Candidate and subscription methods (stubs for compilation)
  getUserSubscription(userId: number): Promise<any>;
  getUserJobCredits(userId: number): Promise<any>;
  searchCandidates(filters: any, options: any): Promise<any>;
  createSearchLog(log: any): Promise<any>;
  getRecentCandidates(options: any): Promise<any>;
  getCandidateProfile(candidateId: string): Promise<any>;
  getSavedCandidate(userId: number, candidateId: string): Promise<any>;
  createProfileView(view: any): Promise<any>;
  incrementCandidateViews(candidateId: string): Promise<any>;
  deductJobCredit(userId: number, amount: number, reason: string): Promise<any>;
  createCvAccess(access: any): Promise<any>;
  updateSavedCandidate(id: string, updates: any): Promise<any>;
  createSavedCandidate(candidate: any): Promise<any>;
  deleteSavedCandidate(id: string): Promise<any>;
  getSavedCandidates(userId: number, options: any): Promise<any>;
  createCandidateContact(contact: any): Promise<any>;
  sendEmail(email: any): Promise<any>;
  getCandidateReport(userId: number, candidateId: string): Promise<any>;
  createCandidateReport(report: any): Promise<any>;
  getCandidateRecommendations(userId: number, params: any, limit: number): Promise<any>;
  getRecentSearches(userId: number, limit: number): Promise<any>;
  getUserJobs(userId: number, options: any): Promise<any>;
  getCandidateSearchAnalytics(userId: number, period: string): Promise<any>;

  // Additional missing methods for content management
  updateCompany(id: number, updates: any): Promise<any>;
  deleteCompany(id: number): Promise<boolean>;
  getJobAnalytics(userId?: number): Promise<any>;
  getCompanyAnalytics(companyId?: number): Promise<any>;
  bulkJobOperation(operation: string, jobIds: number[]): Promise<any>;
  searchContent(query: string, type: string): Promise<any>;
  getContentAnalytics(): Promise<any>;
  exportJobs(format: string, filters: any): Promise<any>;
  importJobs(file: any): Promise<any>;
  uploadCompanyLogo(companyId: number, file: any): Promise<any>;
  uploadCompanyImages(companyId: number, files: any[]): Promise<any>;
  getCompanyUser(userId: number, companyId: number): Promise<any>;

  // Payment and subscription methods
  getStripeCustomer(userId: number): Promise<any>;
  createPayment(payment: any): Promise<any>;
  getSubscriptionPlan(planId: string): Promise<any>;
  getSubscriptionPlans(): Promise<any>;
  createSubscription(subscription: any): Promise<any>;
  updateSubscription(subscriptionId: string, updates: any): Promise<any>;
  createJobCredits(credits: any): Promise<any>;
  getUserPaymentMethods(userId: number): Promise<any>;
  createPaymentMethod(paymentMethod: any): Promise<any>;
  updateUserPaymentMethodsDefault(userId: number, paymentMethodId: string): Promise<any>;
  getPaymentMethod(paymentMethodId: string): Promise<any>;
  deletePaymentMethod(paymentMethodId: string): Promise<any>;
  getUserInvoices(userId: number, options: any): Promise<any>;
  getUserBillingAddresses(userId: number): Promise<any>;
  createBillingAddress(address: any): Promise<any>;
  updateUserBillingAddressesDefault(userId: number, addressId: string): Promise<any>;
  updatePaymentByStripeId(stripeId: string, updates: any): Promise<any>;
  updateSubscriptionByStripeId(stripeId: string, updates: any): Promise<any>;
  updateInvoiceByStripeId(stripeId: string, updates: any): Promise<any>;
}

import { ApiError, Errors, ErrorType } from './middleware/errorHandler';
export class DatabaseStorage implements IStorage {
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
      return result.rowCount > 0;
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
      const [company] = await db.insert(companies).values(insertCompany).returning();
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
      const [job] = await db.insert(jobs).values(insertJob).returning();
      return job;
    } catch (error: any) {
      throw Errors.database(`Failed to create job: ${error.message}`, error);
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
      return result.rowCount > 0;
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
      const [totalResult] = await db.select({ count: count(jobApplications.id) })
        .from(jobApplications)
        .where(whereClause);
      const total = totalResult.count;

      // Get applications with sorting
      const orderByClause = sortOrder === 'desc' 
        ? desc(jobApplications[sortBy as keyof typeof jobApplications]) 
        : jobApplications[sortBy as keyof typeof jobApplications];

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
      const [totalResult] = await db.select({ count: count(jobApplications.id) })
        .from(jobApplications)
        .where(whereClause);
      const total = totalResult.count;

      // Get applications with sorting
      const orderByClause = sortOrder === 'desc' 
        ? desc(jobApplications[sortBy as keyof typeof jobApplications]) 
        : jobApplications[sortBy as keyof typeof jobApplications];

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
      return result.rowCount > 0;
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

      // Mock profile data structure - in real implementation, this would come from a profiles table
      return {
        personal: {
          fullName: user.username, // Using username as placeholder
          phoneNumber: user.email, // Using email as placeholder
          location: "Not specified",
          bio: "Professional seeking opportunities",
          profilePicture: profileImage?.fileUrl,
          professionalImage: professionalImage?.fileUrl,
        },
        education: {
          highestEducation: "Not specified",
          schoolName: "Not specified",
        },
        experience: {
          hasExperience: false,
          jobTitle: "Not specified",
          employer: "Not specified",
        },
        skills: {
          skills: [],
          languages: ["English"],
          hasDriversLicense: false,
          hasTransport: false,
          cvUpload: cvFile?.fileUrl,
        },
        preferences: {
          jobTypes: [],
          locations: [],
          minSalary: 0,
          willingToRelocate: false,
        },
        // Additional profile metadata
        memberSince: user.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        engagementScore: 25,
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

  async updateUserProfile(userId: number, profileData: any): Promise<any> {
    try {
      // In a real implementation, this would update a profiles table
      // For now, we'll just return the updated data
      const currentProfile = await this.getUserProfile(userId);
      
      const updatedProfile = {
        ...currentProfile,
        ...profileData,
        personal: {
          ...currentProfile.personal,
          ...profileData.personal,
        },
        education: {
          ...currentProfile.education,
          ...profileData.education,
        },
        experience: {
          ...currentProfile.experience,
          ...profileData.experience,
        },
        skills: {
          ...currentProfile.skills,
          ...profileData.skills,
        },
        preferences: {
          ...currentProfile.preferences,
          ...profileData.preferences,
        },
      };

      return updatedProfile;
    } catch (error: any) {
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

  // Additional methods for new API endpoints

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseId));
      return user;
    } catch (error: any) {
      throw Errors.database(`Failed to get user by Firebase ID: ${error.message}`, error);
    }
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    try {
      return await db.select().from(jobs).where(eq(jobs.companyId, employerId));
    } catch (error: any) {
      throw Errors.database(`Failed to get jobs by employer: ${error.message}`, error);
    }
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job | undefined> {
    try {
      const [updatedJob] = await db.update(jobs)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(jobs.id, id))
        .returning();
      return updatedJob;
    } catch (error: any) {
      throw Errors.database(`Failed to update job: ${error.message}`, error);
    }
  }

  async deleteJob(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jobs).where(eq(jobs.id, id));
      return result.rowCount > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete job: ${error.message}`, error);
    }
  }

  async getJobApplications(options: {
    page: number;
    limit: number;
    status?: string;
    jobIds?: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: JobApplication[]; pagination: any }> {
    try {
      const { page, limit, status, jobIds, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      let query = db.select().from(jobApplications);

      // Apply filters
      const conditions = [];
      if (status) {
        conditions.push(eq(jobApplications.status, status as any));
      }
      if (jobIds && jobIds.length > 0) {
        conditions.push(or(...jobIds.map(id => eq(jobApplications.jobId, id))));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      query = query.orderBy(sortOrder === 'desc' ? desc(jobApplications.appliedAt) : jobApplications.appliedAt);

      // Apply pagination
      const applications = await query.limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count(jobApplications.id) }).from(jobApplications);
      const total = totalResult.count;

      return {
        data: applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get job applications: ${error.message}`, error);
    }
  }

  // Job Favorites methods (mock implementation - would need a favorites table)
  async addJobFavorite(userId: number, jobId: number): Promise<any> {
    try {
      // This would require a job_favorites table in the schema
      // For now, return a mock response
      return {
        id: Date.now(),
        userId,
        jobId,
        addedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw Errors.database(`Failed to add job favorite: ${error.message}`, error);
    }
  }

  async removeJobFavorite(userId: number, jobId: number): Promise<boolean> {
    try {
      // This would require a job_favorites table in the schema
      // For now, return true
      return true;
    } catch (error: any) {
      throw Errors.database(`Failed to remove job favorite: ${error.message}`, error);
    }
  }

  async getJobFavorite(userId: number, jobId: number): Promise<any> {
    try {
      // This would require a job_favorites table in the schema
      // For now, return null
      return null;
    } catch (error: any) {
      throw Errors.database(`Failed to get job favorite: ${error.message}`, error);
    }
  }

  async getUserJobFavorites(userId: number, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination: any }> {
    try {
      // This would require a job_favorites table in the schema
      // For now, return empty data
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user job favorites: ${error.message}`, error);
    }
  }

  // User Notification methods
  async getUserNotifications(userId: number, options: {
    page: number;
    limit: number;
    type?: string;
    isRead?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: UserNotification[]; pagination: any }> {
    try {
      const { page, limit, type, isRead, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      let query = db.select().from(userNotifications).where(eq(userNotifications.userId, userId));

      // Apply filters
      if (type) {
        query = query.where(and(eq(userNotifications.userId, userId), eq(userNotifications.type, type as any)));
      }
      if (isRead !== undefined) {
        query = query.where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, isRead)));
      }

      // Apply sorting and pagination
      const notifications = await query
        .orderBy(sortOrder === 'desc' ? desc(userNotifications.createdAt) : userNotifications.createdAt)
        .limit(limit)
        .offset(offset);
      const [totalResult] = await db.select({ count: count(userNotifications.id) })
        .from(userNotifications)
        .where(eq(userNotifications.userId, userId));
      const total = totalResult.count;

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user notifications: ${error.message}`, error);
    }
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<UserNotification | undefined> {
    try {
      const [notification] = await db.update(userNotifications)
        .set({ isRead: true, readAt: new Date().toISOString() })
        .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userId, userId)))
        .returning();
      return notification;
    } catch (error: any) {
      throw Errors.database(`Failed to mark notification as read: ${error.message}`, error);
    }
  }

  async markAllNotificationsAsRead(userId: number, type?: string): Promise<number> {
    try {
      let query = db.update(userNotifications)
        .set({ isRead: true, readAt: new Date().toISOString() })
        .where(eq(userNotifications.userId, userId));

      if (type) {
        query = query.where(and(eq(userNotifications.userId, userId), eq(userNotifications.type, type as any)));
      }

      const result = await query.returning();
      return result.length;
    } catch (error: any) {
      throw Errors.database(`Failed to mark all notifications as read: ${error.message}`, error);
    }
  }

  async getNotificationSettings(userId: number): Promise<any> {
    try {
      // This would require a user_settings table in the schema
      // For now, return default settings
      return {
        emailNotifications: true,
        pushNotifications: true,
        applicationUpdates: true,
        jobRecommendations: true,
        systemAnnouncements: true,
        reminderNotifications: true,
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get notification settings: ${error.message}`, error);
    }
  }

  async updateNotificationSettings(userId: number, settings: any): Promise<any> {
    try {
      // This would require a user_settings table in the schema
      // For now, return the settings as-is
      return settings;
    } catch (error: any) {
      throw Errors.database(`Failed to update notification settings: ${error.message}`, error);
    }
  }

  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      const result = await db.delete(userNotifications)
        .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userId, userId)));
      return result.rowCount > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete notification: ${error.message}`, error);
    }
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const [result] = await db.select({ count: count(userNotifications.id) })
        .from(userNotifications)
        .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false)));
      return result.count;
    } catch (error: any) {
      throw Errors.database(`Failed to get unread notification count: ${error.message}`, error);
    }
  }

  // Company hiring metrics methods (stub implementations)
  async getCompaniesWithHiringMetrics(): Promise<any[]> {
    try {
      // Mock implementation - would need hiring_metrics table
      const companies = await this.getCompanies();
      return companies.map(company => ({
        ...company,
        hiringMetrics: {
          totalHires: Math.floor(Math.random() * 50),
          activeJobs: Math.floor(Math.random() * 20),
          averageTimeToHire: Math.floor(Math.random() * 30) + 15,
        }
      }));
    } catch (error: any) {
      throw Errors.database(`Failed to get companies with hiring metrics: ${error.message}`, error);
    }
  }

  async updateCompanyHiringMetrics(companyId: number, metrics: any): Promise<boolean> {
    try {
      // Mock implementation - would need hiring_metrics table
      return true;
    } catch (error: any) {
      throw Errors.database(`Failed to update company hiring metrics: ${error.message}`, error);
    }
  }

  async getHiringTrends(): Promise<any> {
    try {
      // Mock implementation - would need hiring_metrics table
      return {
        totalHires: Math.floor(Math.random() * 1000) + 500,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5,
        topCategories: ['Retail', 'Security', 'General Worker'],
        trendsData: []
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get hiring trends: ${error.message}`, error);
    }
  }

  // Candidate and subscription methods (stub implementations)
  async getUserSubscription(userId: number): Promise<any> {
    try {
      // Mock implementation - would need subscriptions table
      return {
        id: userId,
        plan: 'basic',
        status: 'active',
        jobCredits: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user subscription: ${error.message}`, error);
    }
  }

  async getUserJobCredits(userId: number): Promise<any> {
    try {
      // Mock implementation - would need user_credits table
      return {
        userId,
        credits: 10,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user job credits: ${error.message}`, error);
    }
  }

  async searchCandidates(filters: any, options: any): Promise<any> {
    try {
      // Mock implementation - would need candidates table
      return {
        candidates: [],
        total: 0,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error: any) {
      throw Errors.database(`Failed to search candidates: ${error.message}`, error);
    }
  }

  async createSearchLog(log: any): Promise<any> {
    try {
      // Mock implementation - would need search_logs table
      return {
        id: Date.now(),
        ...log,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create search log: ${error.message}`, error);
    }
  }

  async getRecentCandidates(options: any): Promise<any> {
    try {
      // Mock implementation - would need candidates table
      return {
        candidates: [],
        total: 0
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get recent candidates: ${error.message}`, error);
    }
  }

  async getCandidateProfile(candidateId: string): Promise<any> {
    try {
      // Mock implementation - would need candidates table
      return {
        id: candidateId,
        name: 'Mock Candidate',
        email: 'candidate@example.com',
        skills: [],
        experience: []
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get candidate profile: ${error.message}`, error);
    }
  }

  async getSavedCandidate(userId: number, candidateId: string): Promise<any> {
    try {
      // Mock implementation - would need saved_candidates table
      return null;
    } catch (error: any) {
      throw Errors.database(`Failed to get saved candidate: ${error.message}`, error);
    }
  }

  async createProfileView(view: any): Promise<any> {
    try {
      // Mock implementation - would need profile_views table
      return {
        id: Date.now(),
        ...view,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create profile view: ${error.message}`, error);
    }
  }

  async incrementCandidateViews(candidateId: string): Promise<any> {
    try {
      // Mock implementation - would need candidates table with view count
      return {
        candidateId,
        views: Math.floor(Math.random() * 100) + 1
      };
    } catch (error: any) {
      throw Errors.database(`Failed to increment candidate views: ${error.message}`, error);
    }
  }

  async deductJobCredit(userId: number, amount: number, reason: string): Promise<any> {
    try {
      // Mock implementation - would need user_credits table
      return {
        userId,
        remainingCredits: Math.max(0, 10 - amount),
        deductedAmount: amount,
        reason
      };
    } catch (error: any) {
      throw Errors.database(`Failed to deduct job credit: ${error.message}`, error);
    }
  }

  async createCvAccess(access: any): Promise<any> {
    try {
      // Mock implementation - would need cv_access table
      return {
        id: Date.now(),
        ...access,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create CV access: ${error.message}`, error);
    }
  }

  async updateSavedCandidate(id: string, updates: any): Promise<any> {
    try {
      // Mock implementation - would need saved_candidates table
      return {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update saved candidate: ${error.message}`, error);
    }
  }

  async createSavedCandidate(candidate: any): Promise<any> {
    try {
      // Mock implementation - would need saved_candidates table
      return {
        id: Date.now().toString(),
        ...candidate,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create saved candidate: ${error.message}`, error);
    }
  }

  async deleteSavedCandidate(id: string): Promise<any> {
    try {
      // Mock implementation - would need saved_candidates table
      return true;
    } catch (error: any) {
      throw Errors.database(`Failed to delete saved candidate: ${error.message}`, error);
    }
  }

  async getSavedCandidates(userId: number, options: any): Promise<any> {
    try {
      // Mock implementation - would need saved_candidates table
      return {
        candidates: [],
        total: 0,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get saved candidates: ${error.message}`, error);
    }
  }

  async createCandidateContact(contact: any): Promise<any> {
    try {
      // Mock implementation - would need candidate_contacts table
      return {
        id: Date.now(),
        ...contact,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create candidate contact: ${error.message}`, error);
    }
  }

  async sendEmail(email: any): Promise<any> {
    try {
      // Mock implementation - would integrate with email service
      return {
        id: Date.now(),
        status: 'sent',
        sentAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to send email: ${error.message}`, error);
    }
  }

  async getCandidateReport(userId: number, candidateId: string): Promise<any> {
    try {
      // Mock implementation - would need candidate_reports table
      return null;
    } catch (error: any) {
      throw Errors.database(`Failed to get candidate report: ${error.message}`, error);
    }
  }

  async createCandidateReport(report: any): Promise<any> {
    try {
      // Mock implementation - would need candidate_reports table
      return {
        id: Date.now(),
        ...report,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create candidate report: ${error.message}`, error);
    }
  }

  async getCandidateRecommendations(userId: number, params: any, limit: number): Promise<any> {
    try {
      // Mock implementation - would need ML/recommendation engine
      return {
        recommendations: [],
        total: 0
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get candidate recommendations: ${error.message}`, error);
    }
  }

  async getRecentSearches(userId: number, limit: number): Promise<any> {
    try {
      // Mock implementation - would need search_logs table
      return {
        searches: [],
        total: 0
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get recent searches: ${error.message}`, error);
    }
  }

  async getUserJobs(userId: number, options: any): Promise<any> {
    try {
      // Mock implementation - get jobs posted by user
      return {
        jobs: [],
        total: 0,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user jobs: ${error.message}`, error);
    }
  }

  async getCandidateSearchAnalytics(userId: number, period: string): Promise<any> {
    try {
      // Mock implementation - would need analytics tables
      return {
        totalSearches: Math.floor(Math.random() * 100),
        uniqueCandidatesViewed: Math.floor(Math.random() * 50),
        averageSearchTime: Math.floor(Math.random() * 300) + 60,
        topSearchTerms: [],
        period
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get candidate search analytics: ${error.message}`, error);
    }
  }

  // Payment and subscription methods (stub implementations)
  async getStripeCustomer(userId: number): Promise<any> {
    try {
      // Mock implementation - would integrate with Stripe API
      return {
        id: `cus_${userId}`,
        email: 'user@example.com',
        created: Date.now(),
        default_source: null
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get Stripe customer: ${error.message}`, error);
    }
  }

  async createPayment(payment: any): Promise<any> {
    try {
      // Mock implementation - would need payments table
      return {
        id: Date.now(),
        ...payment,
        status: 'succeeded',
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create payment: ${error.message}`, error);
    }
  }

  async getSubscriptionPlan(planId: string): Promise<any> {
    try {
      // Mock implementation - would need subscription_plans table
      const plans = {
        'basic': { id: 'basic', name: 'Basic Plan', price: 29.99, credits: 10 },
        'premium': { id: 'premium', name: 'Premium Plan', price: 49.99, credits: 25 },
        'enterprise': { id: 'enterprise', name: 'Enterprise Plan', price: 99.99, credits: 100 }
      };
      return plans[planId as keyof typeof plans] || null;
    } catch (error: any) {
      throw Errors.database(`Failed to get subscription plan: ${error.message}`, error);
    }
  }

  async createSubscription(subscription: any): Promise<any> {
    try {
      // Mock implementation - would need subscriptions table
      return {
        id: Date.now(),
        ...subscription,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create subscription: ${error.message}`, error);
    }
  }

  async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
    try {
      // Mock implementation - would need subscriptions table
      return {
        id: subscriptionId,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update subscription: ${error.message}`, error);
    }
  }

  async createJobCredits(credits: any): Promise<any> {
    try {
      // Mock implementation - would need job_credits table
      return {
        id: Date.now(),
        ...credits,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create job credits: ${error.message}`, error);
    }
  }

  async getUserPaymentMethods(userId: number): Promise<any> {
    try {
      // Mock implementation - would need payment_methods table
      return {
        data: [],
        has_more: false
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user payment methods: ${error.message}`, error);
    }
  }

  async createPaymentMethod(paymentMethod: any): Promise<any> {
    try {
      // Mock implementation - would need payment_methods table
      return {
        id: Date.now(),
        ...paymentMethod,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create payment method: ${error.message}`, error);
    }
  }

  async updateUserPaymentMethodsDefault(userId: number, paymentMethodId: string): Promise<any> {
    try {
      // Mock implementation - would need payment_methods table
      return {
        userId,
        defaultPaymentMethodId: paymentMethodId,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update user payment methods default: ${error.message}`, error);
    }
  }

  async getSubscriptionPlans(): Promise<any> {
    try {
      // Mock implementation - would need subscription_plans table
      return [
        { id: 'basic', name: 'Basic Plan', price: 29.99, credits: 10 },
        { id: 'premium', name: 'Premium Plan', price: 49.99, credits: 25 },
        { id: 'enterprise', name: 'Enterprise Plan', price: 99.99, credits: 100 }
      ];
    } catch (error: any) {
      throw Errors.database(`Failed to get subscription plans: ${error.message}`, error);
    }
  }

  async getPaymentMethod(paymentMethodId: string): Promise<any> {
    try {
      // Mock implementation - would need payment_methods table
      return {
        id: paymentMethodId,
        userId: 1,
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: false
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get payment method: ${error.message}`, error);
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<any> {
    try {
      // Mock implementation - would need payment_methods table
      return true;
    } catch (error: any) {
      throw Errors.database(`Failed to delete payment method: ${error.message}`, error);
    }
  }

  async getUserInvoices(userId: number, options: any): Promise<any> {
    try {
      // Mock implementation - would need invoices table
      return {
        data: [],
        pagination: {
          page: options.page || 1,
          limit: options.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get user invoices: ${error.message}`, error);
    }
  }

  async getUserBillingAddresses(userId: number): Promise<any> {
    try {
      // Mock implementation - would need billing_addresses table
      return [];
    } catch (error: any) {
      throw Errors.database(`Failed to get user billing addresses: ${error.message}`, error);
    }
  }

  async createBillingAddress(address: any): Promise<any> {
    try {
      // Mock implementation - would need billing_addresses table
      return {
        id: Date.now(),
        ...address,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to create billing address: ${error.message}`, error);
    }
  }

  async updateUserBillingAddressesDefault(userId: number, addressId: string): Promise<any> {
    try {
      // Mock implementation - would need billing_addresses table
      return {
        userId,
        defaultAddressId: addressId,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update user billing addresses default: ${error.message}`, error);
    }
  }

  async updatePaymentByStripeId(stripeId: string, updates: any): Promise<any> {
    try {
      // Mock implementation - would need payments table
      return {
        stripeId,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update payment by Stripe ID: ${error.message}`, error);
    }
  }

  async updateSubscriptionByStripeId(stripeId: string, updates: any): Promise<any> {
    try {
      // Mock implementation - would need subscriptions table
      return {
        stripeId,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update subscription by Stripe ID: ${error.message}`, error);
    }
  }

  async updateInvoiceByStripeId(stripeId: string, updates: any): Promise<any> {
    try {
      // Mock implementation - would need invoices table
      return {
        stripeId,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update invoice by Stripe ID: ${error.message}`, error);
    }
  }

  // Additional missing method implementations
  async updateCompany(id: number, updates: any): Promise<any> {
    try {
      // Mock implementation - would update companies table
      const company = await this.getCompany(id);
      if (!company) {
        throw Errors.notFound('Company not found');
      }
      return {
        ...company,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to update company: ${error.message}`, error);
    }
  }

  async deleteCompany(id: number): Promise<boolean> {
    try {
      // Mock implementation - would delete from companies table
      return true;
    } catch (error: any) {
      throw Errors.database(`Failed to delete company: ${error.message}`, error);
    }
  }

  async getJobAnalytics(userId?: number): Promise<any> {
    try {
      // Mock implementation - would need analytics tables
      return {
        totalJobs: Math.floor(Math.random() * 1000) + 100,
        activeJobs: Math.floor(Math.random() * 500) + 50,
        featuredJobs: Math.floor(Math.random() * 100) + 10,
        expiredJobs: Math.floor(Math.random() * 200) + 20,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5,
        topCategories: ['Technology', 'Healthcare', 'Finance'],
        userId
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get job analytics: ${error.message}`, error);
    }
  }

  async getCompanyAnalytics(companyId?: number): Promise<any> {
    try {
      // Mock implementation - would need analytics tables
      return {
        totalCompanies: Math.floor(Math.random() * 500) + 50,
        activeCompanies: Math.floor(Math.random() * 400) + 40,
        verifiedCompanies: Math.floor(Math.random() * 300) + 30,
        premiumCompanies: Math.floor(Math.random() * 100) + 10,
        monthlyGrowth: Math.floor(Math.random() * 15) + 3,
        topLocations: ['Johannesburg', 'Cape Town', 'Durban'],
        companyId
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get company analytics: ${error.message}`, error);
    }
  }

  async bulkJobOperation(operation: string, jobIds: number[]): Promise<any> {
    try {
      // Mock implementation - would perform bulk operations on jobs
      return {
        operation,
        jobIds,
        affected: jobIds.length,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to perform bulk job operation: ${error.message}`, error);
    }
  }

  async searchContent(query: string, type: string): Promise<any> {
    try {
      // Mock implementation - would search across content types
      return {
        query,
        type,
        results: [],
        total: 0,
        searchTime: Math.floor(Math.random() * 100) + 10
      };
    } catch (error: any) {
      throw Errors.database(`Failed to search content: ${error.message}`, error);
    }
  }

  async getContentAnalytics(): Promise<any> {
    try {
      // Mock implementation - would need content analytics
      return {
        totalContent: Math.floor(Math.random() * 10000) + 1000,
        totalViews: Math.floor(Math.random() * 100000) + 10000,
        totalSearches: Math.floor(Math.random() * 50000) + 5000,
        popularContent: [],
        searchTrends: []
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get content analytics: ${error.message}`, error);
    }
  }

  async exportJobs(format: string, filters: any): Promise<any> {
    try {
      // Mock implementation - would export jobs in specified format
      return {
        format,
        filters,
        exportUrl: `/exports/jobs_${Date.now()}.${format}`,
        recordCount: Math.floor(Math.random() * 1000) + 100,
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to export jobs: ${error.message}`, error);
    }
  }

  async importJobs(file: any): Promise<any> {
    try {
      // Mock implementation - would import jobs from file
      return {
        fileName: file.originalname || 'import.csv',
        recordsProcessed: Math.floor(Math.random() * 500) + 50,
        recordsImported: Math.floor(Math.random() * 400) + 40,
        errors: [],
        importedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to import jobs: ${error.message}`, error);
    }
  }

  async uploadCompanyLogo(companyId: number, file: any): Promise<any> {
    try {
      // Mock implementation - would upload and store company logo
      return {
        companyId,
        logoUrl: `/uploads/logos/company_${companyId}_${Date.now()}.jpg`,
        fileName: file.originalname || 'logo.jpg',
        uploadedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to upload company logo: ${error.message}`, error);
    }
  }

  async uploadCompanyImages(companyId: number, files: any[]): Promise<any> {
    try {
      // Mock implementation - would upload multiple company images
      const imageUrls = files.map((file, index) => 
        `/uploads/images/company_${companyId}_${Date.now()}_${index}.jpg`
      );
      return {
        companyId,
        imageUrls,
        fileCount: files.length,
        uploadedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to upload company images: ${error.message}`, error);
    }
  }

  async getCompanyUser(userId: number, companyId: number): Promise<any> {
    try {
      // Mock implementation - would check if user belongs to company
      const user = await this.getUser(userId);
      const company = await this.getCompany(companyId);
      
      if (!user || !company) {
        return null;
      }

      return {
        userId,
        companyId,
        role: 'admin', // Mock role
        permissions: ['manage_jobs', 'view_analytics'],
        joinedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw Errors.database(`Failed to get company user: ${error.message}`, error);
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

