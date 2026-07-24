// scripts/generate-migrations.ts
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
// Keep migration generation independent from the Express/Winston runtime. The
// CLI is also used in minimal build environments where those modules may be
// loaded through different ESM/CJS boundaries.
const logger = console;

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

async function generateMigrations() {
  logger.info('Generating database migrations...');
  
  return new Promise<void>((resolve, reject) => {
    // The canonical migrations/ directory contains the repository's reviewed
    // raw SQL history. Because that history predates Drizzle's metadata
    // journal, generating directly into it would recreate a full baseline.
    // Generate a review-only diff in an isolated directory instead.
    exec('npx drizzle-kit generate --config drizzle.generated.config.ts', (error, stdout, stderr) => {
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
