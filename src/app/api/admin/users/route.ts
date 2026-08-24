import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireUser } from '@/lib/apiHelpers';
import { hashPassword, type SessionUser } from '@/lib/auth';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UserListRow {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

async function requireAdmin(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await requireUser();
  if (!user) return { user: null, error: jsonError('Not authenticated', 401) };
  if (user.role !== 'admin') {
    return { user: null, error: jsonError('Admin access required', 403) };
  }
  return { user, error: null };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = getDb()
    .prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name COLLATE NOCASE'
    )
    .all() as UserListRow[];

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const email = emailRaw.trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role === undefined ? 'staff' : body.role;

  if (!name) return jsonError('Name is required', 400);
  if (!email || !email.includes('@')) {
    return jsonError('A valid email is required', 400);
  }
  if (password.length < 6) {
    return jsonError('Password must be at least 6 characters', 400);
  }
  if (role !== 'admin' && role !== 'staff') {
    return jsonError("Role must be 'admin' or 'staff'", 400);
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as { id: number } | undefined;
  if (existing) {
    return jsonError('A user with this email already exists', 409);
  }

  const info = db
    .prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    )
    .run(name, email, hashPassword(password), role);
  const newId = Number(info.lastInsertRowid);

  logAudit(user.id, null, null, 'user_created', { userId: newId, email, role });

  const created = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(newId) as UserListRow;

  return NextResponse.json({ user: created }, { status: 201 });
}
