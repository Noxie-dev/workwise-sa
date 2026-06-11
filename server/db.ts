import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as schema from '../shared/schema';

import { secretManager } from './services/secretManager';

// Database instance
let db: any;
let dbInitialized = false;
let sqliteConnection: any = null;

// Initialize database connection
export async function initializeDatabase() {
  if (dbInitialized) return db;

  try {
    // Get database connection string
    const secretConnectionString = await secretManager.getSecret('DATABASE_URL');
    const fallbackConnectionString =
      process.env.NODE_ENV === 'production' ? undefined : 'sqlite:./test.db';
    const connectionString =
      secretConnectionString || process.env.DATABASE_URL || fallbackConnectionString;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    // Create database client based on connection string
    if (connectionString.startsWith('sqlite')) {
      const sqlitePath = connectionString.replace(/^sqlite:\/*/, '') || 'test.db';
      const sqlite = new Database(sqlitePath);
      sqliteConnection = sqlite;
      db = drizzle(sqlite, { schema });
    } else {
      // PostgreSQL for production
      const client = postgres(connectionString as string);
      sqliteConnection = null;
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

export function getSqliteConnection() {
  return sqliteConnection;
}

export function isSqliteDatabase() {
  return Boolean(sqliteConnection);
}

// Export database instance (for backward compatibility)
export { db };
