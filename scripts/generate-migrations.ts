// scripts/generate-migrations.ts
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
import { logger } from '../server/utils/enhanced-logger';

// Load environment variables
dotenv.config();

async function generateMigrations() {
  logger.info('Generating database migrations...');
  
  return new Promise<void>((resolve, reject) => {
    exec('npx drizzle-kit generate', (error, stdout, stderr) => {
      if (error) {
        logger.error('Failed to generate migrations', { error, stderr });
        reject(error);
        return;
      }
      
      logger.info('Migration files generated successfully');
      logger.debug(stdout);
      
      if (stderr) {
        logger.warn('Warnings during migration generation', { stderr });
      }
      
      resolve();
    });
  });
}

generateMigrations().catch(error => {
  logger.error('Migration generation failed', { error });
  process.exit(1);
});