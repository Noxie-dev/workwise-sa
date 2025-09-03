// Enhanced drizzle.config.ts for PostgreSQL with better migration support
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default to SQLite for development if no DATABASE_URL is provided
const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';
const isPostgres = connectionString.startsWith('postgres');

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  driver: isPostgres ? 'pg' : 'durable-sqlite',
  dbCredentials: {
    connectionString,
  },
  // Enhanced configuration for better migrations
  verbose: true,
  strict: true,
  // PostgreSQL specific optimizations
  ...(isPostgres && {
    // Enable better PostgreSQL support
    pg: {
      // Use native PostgreSQL features
      native: true,
    },
    // Better migration naming and organization
    migrations: {
      // Custom migration naming pattern
      prefix: 'migration',
      // Include timestamp in migration names
      timestamp: true,
    },
    // Enable schema introspection for better type safety
    introspect: {
      // Include comments from database
      comments: true,
      // Include foreign key constraints
      foreignKeys: true,
    },
  }),
  // Migration generation settings
  generate: {
    // Generate TypeScript types for migrations
    types: true,
    // Include schema validation
    validation: true,
  },
  // Better error reporting
  debug: process.env.NODE_ENV === 'development',
} satisfies Config;