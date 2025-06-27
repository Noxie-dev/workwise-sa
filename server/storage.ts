import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  companies, type Company, type InsertCompany,
  jobs, type Job, type InsertJob,
  files, type File, type InsertFile,
  type JobWithCompany
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  // Jobs methods
  getJobs(): Promise<Job[]>;
  getJobsWithCompanies(): Promise<JobWithCompany[]>;
  getFeaturedJobs(): Promise<JobWithCompany[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByCompany(companyId: number): Promise<Job[]>;
  getJobsByCategory(categoryId: number): Promise<Job[]>;
  searchJobs(query: string): Promise<JobWithCompany[]>;
  createJob(job: InsertJob): Promise<Job>;

  // Files methods
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  getFilesByType(fileType: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;

  // Initialize database with sample data (optional)
  initializeData(): Promise<void>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') { // SQLite and PostgreSQL unique violation
        throw Errors.conflict(`User with username '${insertUser.username}' already exists.`, error);
      }
      throw Errors.database(`Failed to create user: ${error.message}`, error);
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
        throw Errors.conflict(`Category with slug '${insertCategory.slug}' already exists.`, error);
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
        throw Errors.conflict(`Company with slug '${insertCompany.slug}' already exists.`, error);
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
      return result.count > 0;
    } catch (error: any) {
      throw Errors.database(`Failed to delete file: ${error.message}`, error);
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

      // Add categories for low-level jobs
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

      // Add companies hiring for low-level jobs
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

      // Add featured jobs focused on low-level positions
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

