/** Read-only audit. Output excludes passwords, hashes, emails and tokens. */
import 'dotenv/config';
import postgres from 'postgres';
import Database from 'better-sqlite3';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Set DATABASE_URL explicitly to select the database to audit');
  let users: { id: number; password: string | null; role: string | null }[];
  if (url.startsWith('sqlite:')) {
    const connection = new Database(url.replace(/^sqlite:\/*/, ''), { readonly: true });
    try {
      users = connection.prepare('SELECT id, password, role FROM users').all() as typeof users;
    } finally {
      connection.close();
    }
  } else {
    const sql = postgres(url);
    try {
      users = await sql<typeof users>`SELECT id, password, role FROM users`;
    } finally {
      await sql.end();
    }
  }
  const findings = users.flatMap(user => {
    const reasons: string[] = [];
    if (user.password && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password))
      reasons.push('Unrecognized password format: require reset');
    if (user.role && user.role !== 'user')
      reasons.push('Verify privileged role against trusted provisioning records');
    return reasons.length ? [{ userId: user.id, role: user.role, reasons }] : [];
  });
  console.log(JSON.stringify({ accountsReviewed: users.length, findings }, null, 2));
}
main().catch(() => {
  console.error(
    'Account audit failed. Verify DATABASE_URL and read access. No account data was changed.'
  );
  process.exitCode = 1;
});
