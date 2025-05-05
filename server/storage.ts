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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  // Job methods
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJobsWithCompanies(): Promise<JobWithCompany[]> {
    // Use the included relations to join with companies
    const jobsWithCompanies = await db.query.jobs.findMany({
      with: {
        company: true
      },
      orderBy: [desc(jobs.createdAt)]
    });

    return jobsWithCompanies as JobWithCompany[];
  }

  async getFeaturedJobs(): Promise<JobWithCompany[]> {
    const featuredJobs = await db.query.jobs.findMany({
      with: {
        company: true
      },
      where: eq(jobs.isFeatured, true),
      orderBy: [desc(jobs.createdAt)]
    });

    return featuredJobs as JobWithCompany[];
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobsByCompany(companyId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.companyId, companyId));
  }

  async getJobsByCategory(categoryId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.categoryId, categoryId));
  }

  async searchJobs(query: string): Promise<JobWithCompany[]> {
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
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.userId, userId));
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.fileType, fileType));
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.count > 0;
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
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
    const companyNames = ['Shoprite', 'Pick n Pay', 'Securitas', 'Engen', 'Sasol', 'Spar', 'Checkers'];
    const companyLocations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Soweto', 'Port Elizabeth', 'Bloemfontein'];
    const companySlugs = ['shoprite', 'pick-n-pay', 'securitas', 'engen', 'sasol', 'spar', 'checkers'];
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
