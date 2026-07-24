import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMigrationFiles, normalizePostgresMigrationSql } from '../../utils/sqlMigrations';

describe('PostgreSQL migration compatibility', () => {
  it('translates supported SQLite-only constructs without changing the SQLite source', () => {
    const source = `
      CREATE TABLE sample (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO sample (id) VALUES (1);
    `;

    const normalized = normalizePostgresMigrationSql(source);

    expect(normalized).toContain('id SERIAL PRIMARY KEY');
    expect(normalized).toContain('created_at TIMESTAMP');
    expect(normalized).toContain('INSERT INTO sample (id) VALUES (1) ON CONFLICT DO NOTHING;');
    expect(normalized).not.toMatch(/AUTOINCREMENT|DATETIME|INSERT OR IGNORE/i);
    expect(source).toMatch(/AUTOINCREMENT|DATETIME|INSERT OR IGNORE/);
  });

  it('normalizes every checked-in migration before PostgreSQL execution', () => {
    const migrationFolder = path.resolve(process.cwd(), 'migrations');
    for (const file of getMigrationFiles(migrationFolder)) {
      const source = fs.readFileSync(path.join(migrationFolder, file), 'utf8');
      const normalized = normalizePostgresMigrationSql(source);
      expect(normalized, file).not.toMatch(/AUTOINCREMENT|DATETIME|INSERT\s+OR\s+IGNORE/i);
    }
  });

  it('activates explicitly marked PostgreSQL-only statements', () => {
    expect(normalizePostgresMigrationSql(
      '-- POSTGRES_ONLY: ALTER TABLE jobs ALTER COLUMN juid SET NOT NULL;',
    )).toBe('ALTER TABLE jobs ALTER COLUMN juid SET NOT NULL;');
  });
});
