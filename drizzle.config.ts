// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default to SQLite for development if no DATABASE_URL is provided
const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: connectionString.startsWith('sqlite') ? 'better-sqlite' : 'pg',
  dbCredentials: {
    connectionString,
  },
  // Customize naming of migration files
  verbose: true,
  strict: true,
} satisfies Config;