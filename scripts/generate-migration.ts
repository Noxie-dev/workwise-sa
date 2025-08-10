// scripts/generate-migration.ts
import { generateMigration } from '../server/migrations';
import { logger } from '../server/utils/logger';

async function main() {
  try {
    const migrationName = process.argv[2];
    
    if (!migrationName) {
      logger.error('Migration name is required');
      console.error('Usage: npm run db:generate-migration -- <migration-name>');
      process.exit(1);
    }
    
    logger.info(`Generating migration: ${migrationName}`);
    await generateMigration(migrationName);
    logger.info('Migration generated successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate migration', { error });
    process.exit(1);
  }
}

main();