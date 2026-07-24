import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import postgres from 'postgres';

dotenv.config({ path: ['.env.local', '.env'] });

const connectionString = process.env.DATABASE_URL || 'sqlite:./test.db';
const migrationDir = path.join(process.cwd(), 'migrations');
const migrationFiles = fs.readdirSync(migrationDir).filter(file => /^\d+.*\.sql$/.test(file)).sort();

async function main() {
  let applied: string[];
  if (connectionString.startsWith('sqlite')) {
    const dbPath = connectionString.replace(/^sqlite:\/*/, '') || './test.db';
    const sqlite = new Database(dbPath, { readonly: true });
    try {
      const table = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'migrations'").get();
      applied = table
        ? (sqlite.prepare('SELECT name FROM migrations ORDER BY name').all() as Array<{ name: string }>).map(row => row.name)
        : [];
    } finally {
      sqlite.close();
    }
  } else {
    const sql = postgres(connectionString, { max: 1 });
    try {
      const rows = await sql<{ name: string }[]>`SELECT name FROM migrations ORDER BY name`;
      applied = rows.map(row => row.name);
    } finally {
      await sql.end();
    }
  }

  const appliedSet = new Set(applied);
  const pending = migrationFiles.filter(file => !appliedSet.has(file));
  console.log(`Migration status (${connectionString.startsWith('sqlite') ? 'SQLite' : 'PostgreSQL'})`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${pending.length}`);
  if (pending.length) pending.forEach(file => console.log(`  - ${file}`));
}

main().catch(error => {
  console.error('Unable to read migration status:', error);
  process.exitCode = 1;
});
