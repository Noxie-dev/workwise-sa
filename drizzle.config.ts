// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default to SQLite for development if no DATABASE_URL is provided.
// Drizzle Kit 0.31+ requires `dialect`; the legacy `driver` field is ignored.
const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';
const isSqlite = connectionString.startsWith('sqlite');
const sqliteUrl = connectionString.replace(/^sqlite:\/*/, '') || './test.db';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  dialect: isSqlite ? 'sqlite' : 'postgresql',
  dbCredentials: isSqlite ? { url: sqliteUrl } : { url: connectionString },
  // Customize naming of migration files
  verbose: true,
  strict: true,
} satisfies Config;
