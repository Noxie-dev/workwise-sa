import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import Database from 'better-sqlite3';

// Load environment variables
config();

// Get database connection string
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Determine database type
    const isSqlite = connectionString.startsWith('sqlite');

    if (isSqlite) {
      // SQLite migrations
      runSqliteMigrations();
    } else {
      // PostgreSQL migrations
      await runPostgresMigrations();
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

async function runPostgresMigrations() {
  // Create PostgreSQL client
  const sql = postgres(connectionString);

  try {
    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Get list of applied migrations
    const appliedMigrations = await sql`SELECT name FROM migrations`;
    const appliedMigrationNames = appliedMigrations.map(m => m.name);

    // Get list of migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order

    // Run migrations that haven't been applied yet
    for (const migrationFile of migrationFiles) {
      if (!appliedMigrationNames.includes(migrationFile)) {
        console.log(`Applying migration: ${migrationFile}`);

        // Read migration file
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        // Run migration in a transaction
        await sql.begin(async sql => {
          // Execute migration SQL
          await sql.unsafe(migrationSql);

          // Record migration as applied
          await sql`INSERT INTO migrations (name) VALUES (${migrationFile})`;
        });

        console.log(`Migration applied: ${migrationFile}`);
      } else {
        console.log(`Migration already applied: ${migrationFile}`);
      }
    }
  } finally {
    await sql.end();
  }
}

function runSqliteMigrations() {
  // Create SQLite database
  const db = new Database('test.db');

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Get list of applied migrations
  const appliedMigrations = db.prepare('SELECT name FROM migrations').all();
  const appliedMigrationNames = appliedMigrations.map(m => m.name);

  // Get list of migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order

  // Run migrations that haven't been applied yet
  for (const migrationFile of migrationFiles) {
    if (!appliedMigrationNames.includes(migrationFile)) {
      console.log(`Applying migration: ${migrationFile}`);

      // Read migration file
      const migrationPath = path.join(migrationsDir, migrationFile);
      let migrationSql = fs.readFileSync(migrationPath, 'utf-8');

      // Convert PostgreSQL-specific SQL to SQLite
      migrationSql = migrationSql
        .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/TIMESTAMP DEFAULT NOW\(\)/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/JSONB/g, 'TEXT'); // Store JSON as text in SQLite

      // Run migration in a transaction
      db.exec('BEGIN TRANSACTION');
      try {
        // Execute migration SQL
        db.exec(migrationSql);

        // Record migration as applied
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationFile);

        db.exec('COMMIT');
        console.log(`Migration applied: ${migrationFile}`);
      } catch (error) {
        db.exec('ROLLBACK');
        console.error(`Error applying migration ${migrationFile}:`, error);
        throw error;
      }
    } else {
      console.log(`Migration already applied: ${migrationFile}`);
    }
  }

  // Close the database
  db.close();
}

runMigrations();
