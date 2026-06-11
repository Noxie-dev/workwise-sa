import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import postgres from 'postgres';

export type MigrationLogger = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};

export type MigrationRunResult = {
  applied: string[];
  skipped: string[];
};

type RunMigrationsOptions = {
  connectionString: string;
  migrationsFolder: string;
  logger: MigrationLogger;
};

const MIGRATIONS_TABLE_SQLITE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
`;

const MIGRATIONS_TABLE_POSTGRES = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`;

export function getMigrationFiles(migrationsFolder: string): string[] {
  return fs
    .readdirSync(migrationsFolder)
    .filter(file => /^\d+.*\.sql$/.test(file))
    .sort();
}

export function getSqliteDatabasePath(connectionString: string): string {
  const rawPath = connectionString.replace(/^sqlite:/, '');

  if (!rawPath) {
    return './test.db';
  }

  if (rawPath.startsWith('//')) {
    const withoutSlashes = rawPath.replace(/^\/+/, '');
    return withoutSlashes.startsWith('.') ? withoutSlashes : `/${withoutSlashes}`;
  }

  return rawPath;
}

function ensureSqliteParentDirectory(dbPath: string) {
  if (dbPath === ':memory:') {
    return;
  }

  const parentDir = path.dirname(path.resolve(dbPath));
  fs.mkdirSync(parentDir, { recursive: true });
}

export function runSqliteMigrations({
  connectionString,
  migrationsFolder,
  logger,
}: RunMigrationsOptions): MigrationRunResult {
  const dbPath = getSqliteDatabasePath(connectionString);
  ensureSqliteParentDirectory(dbPath);

  const db = new Database(dbPath);

  try {
    db.exec(MIGRATIONS_TABLE_SQLITE);

    const appliedRows = db.prepare('SELECT name FROM migrations').all() as Array<{ name: string }>;
    const appliedNames = new Set(appliedRows.map(row => row.name));
    const result: MigrationRunResult = { applied: [], skipped: [] };

    const applyMigration = db.transaction((migrationFile: string, migrationSql: string) => {
      db.exec(migrationSql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationFile);
    });

    for (const migrationFile of getMigrationFiles(migrationsFolder)) {
      if (appliedNames.has(migrationFile)) {
        logger.info(`Migration already applied: ${migrationFile}`);
        result.skipped.push(migrationFile);
        continue;
      }

      logger.info(`Applying migration: ${migrationFile}`);
      const migrationSql = fs.readFileSync(path.join(migrationsFolder, migrationFile), 'utf8');
      applyMigration(migrationFile, migrationSql);
      result.applied.push(migrationFile);
      logger.info(`Migration applied: ${migrationFile}`);
    }

    return result;
  } finally {
    db.close();
  }
}

export async function runPostgresMigrations({
  connectionString,
  migrationsFolder,
  logger,
}: RunMigrationsOptions): Promise<MigrationRunResult> {
  const sql = postgres(connectionString, { max: 1 });

  try {
    await sql.unsafe(MIGRATIONS_TABLE_POSTGRES);

    const appliedRows = await sql<{ name: string }[]>`SELECT name FROM migrations`;
    const appliedNames = new Set(appliedRows.map(row => row.name));
    const result: MigrationRunResult = { applied: [], skipped: [] };

    for (const migrationFile of getMigrationFiles(migrationsFolder)) {
      if (appliedNames.has(migrationFile)) {
        logger.info(`Migration already applied: ${migrationFile}`);
        result.skipped.push(migrationFile);
        continue;
      }

      logger.info(`Applying migration: ${migrationFile}`);
      const migrationSql = fs.readFileSync(path.join(migrationsFolder, migrationFile), 'utf8');
      await sql.begin(async transaction => {
        await transaction.unsafe(migrationSql);
        await transaction.unsafe('INSERT INTO migrations (name) VALUES ($1)', [migrationFile]);
      });
      result.applied.push(migrationFile);
      logger.info(`Migration applied: ${migrationFile}`);
    }

    return result;
  } finally {
    await sql.end();
  }
}

export async function runSqlMigrations(options: RunMigrationsOptions): Promise<MigrationRunResult> {
  if (options.connectionString.startsWith('sqlite')) {
    return runSqliteMigrations(options);
  }

  return runPostgresMigrations(options);
}
