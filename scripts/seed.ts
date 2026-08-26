/**
 * Create the two founding accounts. Nothing else.
 *
 * No academic year, no schools, no sample data — the Head of IQAC creates the
 * year, and the Admin creates schools and the remaining accounts, so the
 * system starts genuinely empty.
 *
 *   npm run seed
 *
 * Passwords may be supplied via SEED_ADMIN_PASSWORD / SEED_HEAD_PASSWORD so
 * real credentials never have to live in a file. Use --force-password to reset
 * these two accounts to the configured values.
 */
import { getDb } from '../src/lib/db';
import { hashPasswordSync } from '../src/lib/auth';
import type { Role } from '../src/lib/roles';

const db = getDb();
const force = process.argv.includes('--force-password');

const ACCOUNTS: {
  name: string;
  email: string;
  password: string;
  role: Role;
}[] = [
  {
    name: 'IQAC Administrator',
    email: 'kams@siberindia.edu.in',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'KAMS@1234',
    role: 'admin',
  },
  {
    name: 'Head of IQAC',
    email: 'iqac@siberindia.edu.in',
    password: process.env.SEED_HEAD_PASSWORD ?? 'IQAC@1234',
    role: 'iqac_head',
  },
];

for (const acct of ACCOUNTS) {
  const email = acct.email.toLowerCase();
  const existing = db
    .prepare('SELECT id, name, role, status FROM users WHERE email = ?')
    .get(email) as
    | { id: number; name: string; role: string; status: string }
    | undefined;

  if (!existing) {
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`
    ).run(acct.name, email, hashPasswordSync(acct.password), acct.role);
    console.log(`created ${acct.role}: ${email}  (password: as configured)`);
    continue;
  }

  // An account carried over from the two-role era will have been mapped to
  // 'coordinator' by the migration; put it back to its intended role and make
  // sure it is active so the system is never left without a way in.
  const fixes: string[] = [];
  if (existing.role !== acct.role) fixes.push('role');
  if (existing.status !== 'active') fixes.push('status');
  if (fixes.length > 0) {
    db.prepare("UPDATE users SET role = ?, status = 'active' WHERE id = ?").run(
      acct.role,
      existing.id
    );
  }

  // Replace a name only when it is still one of the old defaults — a real
  // person's name that somebody set deliberately must not be overwritten.
  const STALE_DEFAULTS = ['IQAC Admin', 'IQAC Staff'];
  if (STALE_DEFAULTS.includes(existing.name)) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(
      acct.name,
      existing.id
    );
    fixes.push('name');
  }
  if (force) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hashPasswordSync(acct.password),
      existing.id
    );
    fixes.push('password');
  }

  console.log(
    fixes.length > 0
      ? `updated ${email}: ${fixes.join(', ')}`
      : `exists, unchanged: ${email}`
  );
}

console.log('');
console.log('Seed complete. Two accounts exist; there is no academic year yet.');
console.log('Sign in as the Head of IQAC to create the first academic year.');
console.log('Change both passwords in Administration once the system is reachable.');
