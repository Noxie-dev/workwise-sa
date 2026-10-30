import './server/env';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url || url.startsWith('sqlite:'))
  throw new Error('PostgreSQL DATABASE_URL is required for schema management');

export default defineConfig({
  schema: './shared/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
