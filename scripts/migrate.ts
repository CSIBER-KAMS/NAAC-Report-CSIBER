/**
 * Bring the database up to the current schema.
 *
 * getDb() runs migrations automatically on first use, so the application is
 * self-healing. This script exists so a deployment can apply them explicitly,
 * before the service starts, and see what happened.
 *
 *   npm run migrate
 */
import { getDb } from '../src/lib/db';

const db = getDb();

const applied = db
  .prepare('SELECT id, applied_at FROM schema_migrations ORDER BY id')
  .all() as { id: string; applied_at: string }[];

console.log('Applied migrations:');
for (const m of applied) {
  console.log(`  ${m.id}  (${m.applied_at})`);
}

const users = db
  .prepare('SELECT role, status, COUNT(*) AS c FROM users GROUP BY role, status')
  .all() as { role: string; status: string; c: number }[];
console.log('');
console.log('Accounts:');
if (users.length === 0) {
  console.log('  (none — run: npm run seed)');
} else {
  for (const u of users) {
    console.log(`  ${u.role.padEnd(14)} ${u.status.padEnd(10)} ${u.c}`);
  }
}

const generations = db
  .prepare('SELECT COUNT(*) AS c FROM generations')
  .get() as { c: number };
const absolute = db
  .prepare(
    "SELECT COUNT(*) AS c FROM generations WHERE file_path LIKE '%/%' OR file_path LIKE '%\\%'"
  )
  .get() as { c: number };
console.log('');
console.log(
  `Generated documents: ${generations.c} (${absolute.c} still holding a path rather than a filename)`
);

console.log('');
console.log('Database is up to date.');
