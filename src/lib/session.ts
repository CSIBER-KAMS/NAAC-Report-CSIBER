/**
 * Who is making this request — resolved against the database, every time.
 *
 * The previous design baked name/email/role into the JWT at login and trusted
 * it for the token's full 12-hour life. That meant demoting, disabling or
 * deleting a user had no effect until they happened to log out. Here the token
 * is treated as carrying ONE trustworthy fact — the user id — and everything
 * that governs access (role, status, school, criterion assignments) is read
 * fresh from `users` on each request.
 *
 * NODE-ONLY: touches better-sqlite3. `middleware.ts` runs on the edge runtime
 * and must never import this module.
 */
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getDb } from './db';
import { SESSION_COOKIE, sessionSecret } from './sessionSecret';
import type { Role, UserStatus } from './roles';
import type { PermSubject } from './permissions';

export interface AuthUser extends PermSubject {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  schoolId: number | null;
  schoolName: string | null;
  /** Criterion numbers this user is assigned (0-7). Empty for unscoped roles. */
  criteria: number[];
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  school_id: number | null;
  school_name: string | null;
  token_valid_from: string | null;
}

/**
 * Read the session cookie and resolve it to a live user.
 *
 * Returns null when: there is no cookie, the signature or expiry fails, the
 * user no longer exists, the account is not `active`, or the token was issued
 * before `token_valid_from` (which is how a password reset kills old sessions).
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: number;
  let issuedAt: number | undefined;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const claim = payload.user as { id?: unknown } | undefined;
    const id = claim?.id;
    if (typeof id !== 'number' || !Number.isInteger(id)) return null;
    userId = id;
    issuedAt = typeof payload.iat === 'number' ? payload.iat : undefined;
  } catch {
    return null;
  }

  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.school_id,
              s.name AS school_name, u.token_valid_from
         FROM users u
    LEFT JOIN schools s ON s.id = u.school_id
        WHERE u.id = ?`
    )
    .get(userId) as UserRow | undefined;

  if (!row) return null;
  if (row.status !== 'active') return null;

  if (row.token_valid_from && issuedAt !== undefined) {
    const validFrom = Math.floor(
      new Date(row.token_valid_from.replace(' ', 'T') + 'Z').getTime() / 1000
    );
    if (Number.isFinite(validFrom) && issuedAt < validFrom) return null;
  }

  const criteria = (
    getDb()
      .prepare(
        'SELECT criterion FROM user_criteria WHERE user_id = ? ORDER BY criterion'
      )
      .all(row.id) as { criterion: number }[]
  ).map((r) => r.criterion);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    schoolId: row.school_id,
    schoolName: row.school_name,
    criteria,
  };
}

/**
 * May this user approve pending accounts?
 *
 * Normally the Head of IQAC only — approval is deliberately a different person
 * from the Admin who creates the account, so no single person can both mint
 * and authorise an identity.
 *
 * BREAK-GLASS: if there is no active Head at all, an Admin may approve.
 * Without this a fresh install could deadlock — the Head's own account could
 * never be brought online by anyone.
 */
export function canApproveAccounts(user: AuthUser): boolean {
  if (user.role === 'iqac_head') return true;
  if (user.role !== 'admin') return false;
  const { c } = getDb()
    .prepare(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'iqac_head' AND status = 'active'"
    )
    .get() as { c: number };
  return c === 0;
}

/** Set token_valid_from to now, invalidating every existing session for a user. */
export function invalidateSessions(userId: number): void {
  getDb()
    .prepare("UPDATE users SET token_valid_from = datetime('now') WHERE id = ?")
    .run(userId);
}
