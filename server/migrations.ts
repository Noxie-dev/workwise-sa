import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils/logger';
import { secretManager } from './services/secretManager';
import { runSqlMigrations } from './utils/sqlMigrations.ts';

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    const connectionString = (await secretManager.getSecret('DATABASE_URL')) || 'sqlite:./test.db';
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

    logger.info('Running database migrations', {
      connectionType: connectionString.startsWith('sqlite') ? 'SQLite' : 'PostgreSQL',
    });

    const result = await runSqlMigrations({ connectionString, migrationsFolder, logger });
    logger.info('Database migrations completed successfully', {
      applied: result.applied.length,
      skipped: result.skipped.length,
    });
  } catch (error) {
    logger.error('Migration failed', { error });
    throw new Error(`Failed to run migrations: ${error.message}`);
  }
}
