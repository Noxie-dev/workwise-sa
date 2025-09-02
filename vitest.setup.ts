// vitest.setup.ts
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
const testEnvPath = path.resolve(process.cwd(), '.env.test');
if (fs.existsSync(testEnvPath)) {
  config({ path: testEnvPath });
} else {
  config(); // Fall back to default .env
}

// Set test environment
process.env.NODE_ENV = 'test';

// Mock any global dependencies here if needed