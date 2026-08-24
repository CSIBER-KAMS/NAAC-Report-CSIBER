import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

export const SESSION_COOKIE = 'aqar_session';

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AQAR_SECRET ?? 'csiber-aqar-dev-secret-change-in-production'
  );
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}

/** Read the current user inside a server component / route handler. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function authenticate(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const row = getDb()
    .prepare(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?'
    )
    .get(email.trim().toLowerCase()) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: 'admin' | 'staff';
      }
    | undefined;
  if (!row) return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
