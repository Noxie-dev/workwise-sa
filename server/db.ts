import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as schema from "../shared/schema";

import { secretManager } from './services/secretManager';

// Get database connection string
const connectionString = await secretManager.getSecret('DATABASE_URL');

// Create database client based on connection string
let db;
if (connectionString?.startsWith('sqlite')) {
  // SQLite for testing
  const sqlite = new Database('test.db');
  db = drizzle(sqlite, { schema });
} else {
  // PostgreSQL for production
  const client = postgres(connectionString as string);
  db = drizzlePostgres(client, { schema });
}

// Export database instance
export { db };