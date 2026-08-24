/**
 * Seed the CSIBER AQAR database with initial users and the current
 * academic year. Idempotent — safe to run repeatedly.
 *
 *   npm run seed
 */
import { getDb } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

const db = getDb();

function ensureUser(
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'staff'
) {
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (existing) {
    console.log(`user exists: ${email}`);
    return;
  }
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(name, email.toLowerCase(), hashPassword(password), role);
  console.log(`created ${role}: ${email} (password: ${password})`);
}

function ensureYear(label: string) {
  const existing = db.prepare('SELECT id FROM years WHERE label = ?').get(label);
  if (existing) {
    console.log(`year exists: ${label}`);
    return;
  }
  db.prepare('INSERT INTO years (label) VALUES (?)').run(label);
  console.log(`created year: ${label}`);
}

ensureUser('IQAC Admin', 'kams@siberindia.edu.in', 'admin123', 'admin');
ensureUser('IQAC Staff', 'iqac@siberindia.edu.in', 'staff123', 'staff');
ensureYear('2025-26');

console.log('Seed complete. Change the default passwords after first login.');
