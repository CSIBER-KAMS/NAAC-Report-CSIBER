/**
 * DEVELOPER FIXTURE — creates one account per role for verification.
 *
 *   AQAR_ALLOW_SAMPLE_DATA=1 npx tsx scripts/dev/test-accounts.ts
 */
if (
  process.env.NODE_ENV === 'production' ||
  process.env.AQAR_ALLOW_SAMPLE_DATA !== '1'
) {
  console.error(
    'Refusing to run: developer fixture. Set AQAR_ALLOW_SAMPLE_DATA=1.'
  );
  process.exit(1);
}

import { getDb } from '../../src/lib/db';
import { hashPasswordSync } from '../../src/lib/auth';

const db = getDb();

function school(name: string): number {
  db.prepare('INSERT OR IGNORE INTO schools (name) VALUES (?)').run(name);
  return (db.prepare('SELECT id FROM schools WHERE name = ?').get(name) as {
    id: number;
  }).id;
}

const mgmt = school('School of Management');
const cs = school('School of Computer Studies');

function upsert(
  name: string,
  email: string,
  password: string,
  role: string,
  status: string,
  schoolId: number | null,
  criteria: number[]
) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
    | { id: number }
    | undefined;
  let id: number;
  if (existing) {
    db.prepare(
      'UPDATE users SET name=?, password_hash=?, role=?, status=?, school_id=? WHERE id=?'
    ).run(name, hashPasswordSync(password), role, status, schoolId, existing.id);
    id = existing.id;
  } else {
    const r = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, status, school_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(name, email, hashPasswordSync(password), role, status, schoolId);
    id = Number(r.lastInsertRowid);
  }
  db.prepare('DELETE FROM user_criteria WHERE user_id = ?').run(id);
  const ins = db.prepare(
    'INSERT INTO user_criteria (user_id, criterion) VALUES (?, ?)'
  );
  for (const c of criteria) ins.run(id, c);
  console.log(`${role.padEnd(13)} ${status.padEnd(8)} ${email}`);
  return id;
}

upsert(
  'Dr. Coordinator Three',
  'coord3@siberindia.edu.in',
  'Coord@12345',
  'coordinator',
  'active',
  null,
  [1, 3]
);
upsert(
  'Prof. Rep Management',
  'rep.mgmt@siberindia.edu.in',
  'Rep@123456789',
  'school_rep',
  'active',
  mgmt,
  [1]
);
upsert(
  'Pending Coordinator',
  'pending@siberindia.edu.in',
  'Pending@12345',
  'coordinator',
  'pending',
  null,
  [2]
);

console.log('');
console.log(`schools: School of Management (${mgmt}), School of Computer Studies (${cs})`);
