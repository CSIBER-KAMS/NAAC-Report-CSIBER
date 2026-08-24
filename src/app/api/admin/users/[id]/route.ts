import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireUser } from '@/lib/apiHelpers';
import { hashPassword, type SessionUser } from '@/lib/auth';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UserRow {
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

function getUserById(id: number): UserRow | undefined {
  return getDb()
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(id) as UserRow | undefined;
}

function adminCount(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
    .get() as { n: number };
  return row.n;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const id = parseId(params.id);
  if (id === null) return jsonError('User not found', 404);
  const target = getUserById(id);
  if (!target) return jsonError('User not found', 404);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  const changedFields: string[] = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return jsonError('Name must be a non-empty string', 400);
    }
    updates.push('name = ?');
    values.push(body.name.trim());
    changedFields.push('name');
  }

  if (body.role !== undefined) {
    if (body.role !== 'admin' && body.role !== 'staff') {
      return jsonError("Role must be 'admin' or 'staff'", 400);
    }
    if (
      target.role === 'admin' &&
      body.role === 'staff' &&
      adminCount() <= 1
    ) {
      return jsonError('Cannot demote the last admin', 400);
    }
    updates.push('role = ?');
    values.push(body.role);
    changedFields.push('role');
  }

  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 6) {
      return jsonError('Password must be at least 6 characters', 400);
    }
    updates.push('password_hash = ?');
    values.push(hashPassword(body.password));
    changedFields.push('password');
  }

  if (updates.length === 0) return jsonError('Nothing to update', 400);

  getDb()
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .run(...values, id);

  logAudit(user.id, null, null, 'user_updated', {
    userId: id,
    email: target.email,
    fields: changedFields,
  });

  return NextResponse.json({ user: getUserById(id) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const id = parseId(params.id);
  if (id === null) return jsonError('User not found', 404);
  const target = getUserById(id);
  if (!target) return jsonError('User not found', 404);

  if (target.id === user.id) {
    return jsonError('You cannot delete your own account', 400);
  }
  if (target.role === 'admin' && adminCount() <= 1) {
    return jsonError('Cannot delete the last admin', 400);
  }

  const db = getDb();
  // Null out references so the FK constraints allow deletion; audit_log keeps
  // its (unconstrained) user_id for history.
  const remove = db.transaction((userId: number) => {
    db.prepare('UPDATE metric_values SET updated_by = NULL WHERE updated_by = ?').run(userId);
    db.prepare('UPDATE evidence SET uploaded_by = NULL WHERE uploaded_by = ?').run(userId);
    db.prepare('UPDATE change_requests SET created_by = NULL WHERE created_by = ?').run(userId);
    db.prepare('UPDATE generations SET generated_by = NULL WHERE generated_by = ?').run(userId);
    db.prepare('UPDATE part_a SET updated_by = NULL WHERE updated_by = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  remove(id);

  logAudit(user.id, null, null, 'user_deleted', {
    userId: id,
    email: target.email,
  });

  return NextResponse.json({ ok: true });
}
