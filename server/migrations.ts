// server/migrations.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js/migrator';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils/logger';
import { secretManager } from './services/secretManager';

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    const connectionString = await secretManager.getSecret('DATABASE_URL') || 'sqlite:./test.db';
    const migrationsFolder = path.join(process.cwd(), 'migrations');

    // Ensure migrations folder exists
    if (!fs.existsSync(migrationsFolder)) {
      logger.warn(`Migrations folder not found at ${migrationsFolder}`);
      
      // Create migrations folder if it doesn't exist
      fs.mkdirSync(migrationsFolder, { recursive: true });
      logger.info(`Created migrations folder at ${migrationsFolder}`);
      
      // No migrations to run yet
      return;
    }

    // Check if there are any migration files
    const migrationFiles = fs.readdirSync(migrationsFolder);
    if (migrationFiles.length === 0) {
      logger.info('No migration files found, skipping migrations');
      return;
    }

    logger.info('Running database migrations', { connectionType: connectionString.startsWith('sqlite') ? 'SQLite' : 'PostgreSQL' });

    if (connectionString.startsWith('sqlite')) {
      // SQLite migrations
      const dbPath = connectionString.replace('sqlite:', '');
      const db = new Database(dbPath);
      const drizzleDb = drizzle(db);
      
      await migrate(drizzleDb, { migrationsFolder });
      logger.info('SQLite migrations completed successfully');
    } else {
      // PostgreSQL migrations
      const migrationClient = postgres(connectionString, { max: 1 });
      const drizzleDb = drizzlePostgres(migrationClient);
      
      await migratePostgres(drizzleDb, { migrationsFolder });
      logger.info('PostgreSQL migrations completed successfully');
      
      // Close the connection
      await migrationClient.end();
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    throw new Error(`Failed to run migrations: ${error.message}`);
  }
}