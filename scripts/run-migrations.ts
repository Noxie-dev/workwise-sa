import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logger = {
  info: console.log,
  error: console.error,
};

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
    const migrationModule = await import('../server/utils/sqlMigrations.ts') as any;
    const runSqlMigrations =
      migrationModule.runSqlMigrations ?? migrationModule.default?.runSqlMigrations;
    if (!runSqlMigrations) {
      throw new Error('Raw SQL migration runner could not be loaded');
    }

    const connectionType = connectionString.startsWith('sqlite') ? 'SQLite' : 'PostgreSQL';
    logger.info(`Running ${connectionType} migrations...`);
    const result = await runSqlMigrations({ connectionString, migrationsFolder, logger });
    logger.info(
      `${connectionType} migrations completed successfully (${result.applied.length} applied, ${result.skipped.length} skipped)`,
    );
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
}

runMigrations().catch(console.error);
