/**
 * Password verification and session-token minting.
 *
 * Note what is NOT here any more: reading the current user. That moved to
 * session.ts, which re-reads role and status from the database rather than
 * trusting the token. The token carries the user id and nothing that governs
 * access, so a stale token cannot grant stale privileges.
 */
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { sessionSecret, SESSION_MAX_AGE } from './sessionSecret';
import type { Role, UserStatus } from './roles';

export { SESSION_COOKIE } from './sessionSecret';

/** The minimal identity embedded in the token. */
export interface TokenUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/**
 * A bcrypt hash of a throwaway value, compared against when the email is
 * unknown so that "no such user" costs the same time as "wrong password".
 * Without it, response timing tells an attacker which emails exist.
 */
const DUMMY_HASH = bcrypt.hashSync('unused-placeholder-value', 10);

export interface AuthenticateResult {
  ok: boolean;
  user?: { id: number; name: string; email: string; role: Role; status: UserStatus };
}

/**
 * Verify credentials. Returns the user row on success WITHOUT considering
 * status — the caller decides how to report a pending or disabled account,
 * because those need different messages from "wrong password".
 */
export async function authenticate(
  email: string,
  password: string
): Promise<AuthenticateResult> {
  const row = getDb()
    .prepare(
      'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?'
    )
    .get(email.trim().toLowerCase()) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: Role;
        status: UserStatus;
      }
    | undefined;

  if (!row) {
    // Equalise timing against the unknown-email case.
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false };
  }

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return { ok: false };

  return {
    ok: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
    },
  };
}

export async function createSessionToken(user: TokenUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecret());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Synchronous variant for scripts (seed), where blocking is fine. */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export const MIN_PASSWORD_LENGTH = 12;

/**
 * Password policy for accounts created through the UI. Deliberately not
 * applied to the seeded accounts, whose values are supplied by the operator.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password)
  ).length;
  if (classes < 3) {
    return 'Password must include at least three of: lowercase, uppercase, digit, symbol.';
  }
  return null;
}
