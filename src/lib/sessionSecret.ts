/**
 * Session cookie name, signing secret and cookie options.
 *
 * EDGE-SAFE: zero imports. `middleware.ts` runs on the edge runtime and cannot
 * pull in node built-ins or better-sqlite3, so this module is deliberately
 * dependency-free and imported by BOTH middleware.ts and lib/auth.ts. Keeping
 * one copy is the point — the previous code duplicated a hardcoded fallback
 * secret in both files, which could silently drift apart.
 */

export const SESSION_COOKIE = 'aqar_session';

/** Session lifetime in seconds. */
export const SESSION_MAX_AGE = 12 * 60 * 60;

const MIN_SECRET_LENGTH = 32;

/**
 * The JWT signing key.
 *
 * THROWS when AQAR_SECRET is missing or too short. This is deliberate: the
 * previous behaviour silently fell back to a hardcoded literal that is
 * committed to the repository, meaning anyone who could read the source could
 * forge an admin session. Failing loudly is the only safe default for an
 * internet-facing deployment.
 */
export function sessionSecret(): Uint8Array {
  const raw = process.env.AQAR_SECRET;
  if (!raw || raw.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `AQAR_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Refusing to sign or verify sessions. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" ' +
        'and set it in the environment (see docs/RUNBOOK.md).'
    );
  }
  return new TextEncoder().encode(raw);
}

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  secure: boolean;
  maxAge: number;
}

/**
 * Cookie attributes. These must be IDENTICAL when setting and when clearing —
 * browsers only delete a cookie when the attributes match the one they hold.
 *
 * `secure` is on in production only, so local http development still works.
 */
export function sessionCookieOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  };
}

/** Attributes for deleting the session cookie. */
export function clearedSessionCookie(): SessionCookieOptions {
  return sessionCookieOptions(0);
}
