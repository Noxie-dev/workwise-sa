import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as schema from "../shared/schema";

import { secretManager } from './services/secretManager';

// Database instance
let db: any;
let dbInitialized = false;

// Initialize database connection
export async function initializeDatabase() {
  if (dbInitialized) return db;
  
  try {
    // Get database connection string
    const connectionString = await secretManager.getSecret('DATABASE_URL');
    
    // Create database client based on connection string
    if (connectionString?.startsWith('sqlite')) {
      // SQLite for testing
      const sqlite = new Database('test.db');
      db = drizzle(sqlite, { schema });
    } else {
      // PostgreSQL for production
      const client = postgres(connectionString as string);
      db = drizzlePostgres(client, { schema });
    }
    
    dbInitialized = true;
    console.log('✅ Database connection initialized');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Export database instance getter
export function getDB() {
  if (!dbInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export database instance (for backward compatibility)
export { db };
