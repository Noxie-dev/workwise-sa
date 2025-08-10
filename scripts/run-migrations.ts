// scripts/run-migrations.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { logger } from '../server/utils/enhanced-logger';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';
  const migrationsFolder = path.join(process.cwd(), 'migrations');

  // Ensure migrations folder exists
  if (!fs.existsSync(migrationsFolder)) {
    logger.error(`Migrations folder not found at ${migrationsFolder}`);
    logger.info('Run "npm run db:generate" to generate migrations first');
    process.exit(1);
  }

  try {
    if (connectionString.startsWith('sqlite')) {
      // SQLite migrations
      logger.info('Running SQLite migrations...');
      const db = new Database(connectionString.replace('sqlite:', ''));
      const drizzleDb = drizzle(db);
      
      await migrate(drizzleDb, { migrationsFolder });
      logger.info('SQLite migrations completed successfully');
    } else {
      // PostgreSQL migrations
      logger.info('Running PostgreSQL migrations...');
      const migrationClient = postgres(connectionString, { max: 1 });
      const drizzleDb = drizzlePostgres(migrationClient);
      
      await migratePostgres(drizzleDb, { migrationsFolder });
      logger.info('PostgreSQL migrations completed successfully');
      
      // Close the connection
      await migrationClient.end();
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
}

runMigrations().catch(console.error);