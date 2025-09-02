// server/migrations/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as path from 'path';
import { logger } from '../utils/logger';
import { secretManager } from '../services/secretManager';

/**
 * Run database migrations
 * @param migrationsFolder Path to migrations folder
 */
export async function runMigrations(migrationsFolder = path.join(__dirname, 'sql')): Promise<void> {
  try {
    logger.info('Running database migrations', { migrationsFolder });
    
    // Get database connection string
    const connectionString = await secretManager.getSecret('DATABASE_URL');
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Run migrations based on database type
    if (connectionString.startsWith('sqlite')) {
      // SQLite migrations
      const sqlite = new Database(connectionString.replace('sqlite://', ''));
      const db = drizzle(sqlite);
      
      await migrateSqlite(db, { migrationsFolder });
      logger.info('SQLite migrations completed successfully');
    } else {
      // PostgreSQL migrations
      const client = postgres(connectionString);
      const db = drizzlePostgres(client);
      
      await migratePostgres(db, { migrationsFolder });
      logger.info('PostgreSQL migrations completed successfully');
      
      // Close the connection
      await client.end();
    }
  } catch (error) {
    logger.error('Failed to run database migrations', { error });
    throw error;
  }
}

/**
 * Generate migration SQL files
 * @param name Migration name
 */
export async function generateMigration(name: string): Promise<void> {
  try {
    const { execSync } = require('child_process');
    
    // Run drizzle-kit generate command
    execSync(`npx drizzle-kit generate:sqlite --schema=../shared/schema.ts --out=./migrations/sql --name=${name}`);
    
    logger.info(`Migration "${name}" generated successfully`);
  } catch (error) {
    logger.error('Failed to generate migration', { error });
    throw error;
  }
}