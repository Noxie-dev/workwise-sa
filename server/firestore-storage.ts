import {
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Company, type InsertCompany,
  type Job, type InsertJob,
  type File, type InsertFile,
  type JobWithCompany
} from "@shared/schema";
import { db } from "./firebase";
import { log } from "./vite";
import { IStorage } from "./storage";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

/**
 * Firestore implementation of the storage interface.
 */
export class FirestoreStorage implements IStorage {
  // Collection references
  private usersCollection = db.collection('users');
  private categoriesCollection = db.collection('categories');
  private companiesCollection = db.collection('companies');
  private jobsCollection = db.collection('jobs');
  private filesCollection = db.collection('files');

  // Helper to convert Firestore documents to our domain models
  private convertDoc<T>(doc: FirebaseFirestore.DocumentSnapshot): T | undefined {
    if (!doc.exists) return undefined;

    const data = doc.data();
    return {
      id: parseInt(doc.id), // Convert string ID to number to match original schema
      ...data
    } as unknown as T;
  }

  private convertDocs<T>(docs: FirebaseFirestore.QuerySnapshot): T[] {
    return docs.docs.map(doc => {
      const data = doc.data();
      return {
        id: parseInt(doc.id), // Convert string ID to number
        ...data
      } as unknown as T;
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const doc = await this.usersCollection.doc(id.toString()).get();
    return this.convertDoc<User>(doc);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.usersCollection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertDoc<User>(snapshot.docs[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Get the next ID
    const counterDoc = await db.collection('counters').doc('users').get();
    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data()?.value || 0) + 1;
    }

    await db.collection('counters').doc('users').set({ value: nextId });

    // Create the user with the ID
    const userWithTimestamp = {
      ...insertUser,
      createdAt: Timestamp.now()
    };

    await this.usersCollection.doc(nextId.toString()).set(userWithTimestamp);

    return {
      id: nextId,
      ...userWithTimestamp
    } as unknown as User;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const snapshot = await this.categoriesCollection.get();
    return this.convertDocs<Category>(snapshot);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const doc = await this.categoriesCollection.doc(id.toString()).get();
    return this.convertDoc<Category>(doc);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const snapshot = await this.categoriesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertDoc<Category>(snapshot.docs[0]);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    // Get the next ID
    const counterDoc = await db.collection('counters').doc('categories').get();
    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data()?.value || 0) + 1;
    }

    await db.collection('counters').doc('categories').set({ value: nextId });

    await this.categoriesCollection.doc(nextId.toString()).set(insertCategory);

    return {
      id: nextId,
      ...insertCategory
    } as Category;
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    const snapshot = await this.companiesCollection.get();
    return this.convertDocs<Company>(snapshot);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const doc = await this.companiesCollection.doc(id.toString()).get();
    return this.convertDoc<Company>(doc);
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const snapshot = await this.companiesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertDoc<Company>(snapshot.docs[0]);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    // Get the next ID
    const counterDoc = await db.collection('counters').doc('companies').get();
    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data()?.value || 0) + 1;
    }

    await db.collection('counters').doc('companies').set({ value: nextId });

    await this.companiesCollection.doc(nextId.toString()).set(insertCompany);

    return {
      id: nextId,
      ...insertCompany
    } as Company;
  }

  // Job methods
  async getJobs(): Promise<Job[]> {
    const snapshot = await this.jobsCollection.get();
    return this.convertDocs<Job>(snapshot);
  }

  async getJobsWithCompanies(): Promise<JobWithCompany[]> {
    const snapshot = await this.jobsCollection
      .orderBy('createdAt', 'desc')
      .get();

    const jobs = this.convertDocs<Job>(snapshot);

    // Fetch the associated companies
    const result: JobWithCompany[] = [];
    for (const job of jobs) {
      const company = await this.getCompany(job.companyId);
      if (company) {
        result.push({
          ...job,
          company
        });
      }
    }

    return result;
  }

  async getFeaturedJobs(): Promise<JobWithCompany[]> {
    const snapshot = await this.jobsCollection
      .where('isFeatured', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const jobs = this.convertDocs<Job>(snapshot);

    // Fetch the associated companies
    const result: JobWithCompany[] = [];
    for (const job of jobs) {
      const company = await this.getCompany(job.companyId);
      if (company) {
        result.push({
          ...job,
          company
        });
      }
    }

    return result;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const doc = await this.jobsCollection.doc(id.toString()).get();
    return this.convertDoc<Job>(doc);
  }

  async getJobsByCompany(companyId: number): Promise<Job[]> {
    const snapshot = await this.jobsCollection
      .where('companyId', '==', companyId)
      .get();

    return this.convertDocs<Job>(snapshot);
  }

  async getJobsByCategory(categoryId: number): Promise<Job[]> {
    const snapshot = await this.jobsCollection
      .where('categoryId', '==', categoryId)
      .get();

    return this.convertDocs<Job>(snapshot);
  }

  async searchJobs(query: string): Promise<JobWithCompany[]> {
    if (!query || query.trim() === '') {
      return await this.getJobsWithCompanies();
    }

    // Note: In a production app, you would use a proper search solution
    // like Algolia or Firebase's full-text search extensions
    // This is a simplified approach for development purposes
    const snapshot = await this.jobsCollection.get();
    const jobs = this.convertDocs<Job>(snapshot);
    const searchQuery = query.toLowerCase();

    const filteredJobs = jobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery) ||
      job.description.toLowerCase().includes(searchQuery)
    );

    // Fetch the associated companies
    const result: JobWithCompany[] = [];
    for (const job of filteredJobs) {
      const company = await this.getCompany(job.companyId);
      if (company) {
        result.push({
          ...job,
          company
        });
      }
    }

    // Sort by createdAt (descending)
    return result.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Timestamp
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    // Get the next ID
    const counterDoc = await db.collection('counters').doc('jobs').get();
    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data()?.value || 0) + 1;
    }

    await db.collection('counters').doc('jobs').set({ value: nextId });

    const jobWithTimestamp = {
      ...insertJob,
      createdAt: Timestamp.now()
    };

    await this.jobsCollection.doc(nextId.toString()).set(jobWithTimestamp);

    return {
      id: nextId,
      ...jobWithTimestamp
    } as Job;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    const doc = await this.filesCollection.doc(id.toString()).get();
    return this.convertDoc<File>(doc);
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    const snapshot = await this.filesCollection
      .where('userId', '==', userId)
      .get();

    return this.convertDocs<File>(snapshot);
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    const snapshot = await this.filesCollection
      .where('fileType', '==', fileType)
      .get();

    return this.convertDocs<File>(snapshot);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    // Get the next ID
    const counterDoc = await db.collection('counters').doc('files').get();
    let nextId = 1;

    if (counterDoc.exists) {
      nextId = (counterDoc.data()?.value || 0) + 1;
    }

    await db.collection('counters').doc('files').set({ value: nextId });

    const fileWithTimestamp = {
      ...insertFile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await this.filesCollection.doc(nextId.toString()).set(fileWithTimestamp);

    return {
      id: nextId,
      ...fileWithTimestamp
    } as File;
  }

  async deleteFile(id: number): Promise<boolean> {
    try {
      await this.filesCollection.doc(id.toString()).delete();
      return true;
    } catch (error) {
      log(`Error deleting file: ${error}`);
      return false;
    }
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
    try {
      // Check if database already has data
      const existingCategories = await this.categoriesCollection.limit(1).get();
      if (!existingCategories.empty) {
        log('Database already has data, skipping initialization');
        return; // Database already has data
      }

      log('Initializing database with sample data...');

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

      log('Database initialization complete');
    } catch (error) {
      log(`Error initializing data: ${error}`);
      throw error;
    }
  }
}

