// scripts/generate-migrations.ts
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateMigrations() {
  console.log('🔄 Generating database migrations...');
  
  return new Promise<void>((resolve, reject) => {
    exec('npx drizzle-kit generate', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to generate migrations:', error);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }
      
      console.log('✅ Migration files generated successfully');
      if (stdout) {
        console.log('📝 Output:', stdout);
      }
      
      if (stderr) {
        console.warn('⚠️  Warnings during migration generation:', stderr);
      }
      
      resolve();
    });
  });
}

generateMigrations().catch(error => {
  console.error('💥 Migration generation failed:', error);
  process.exit(1);
});