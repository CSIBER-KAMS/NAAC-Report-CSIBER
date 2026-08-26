import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireCan } from '@/lib/apiHelpers';
import { hashPassword, validatePassword } from '@/lib/auth';
import {
  isRole,
  isUserStatus,
  ROLES,
  ROLE_LABEL,
  USER_STATUSES,
  type Role,
  type UserStatus,
} from '@/lib/roles';
import { invalidateSessions } from '@/lib/session';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  school_id: number | null;
  school_name: string | null;
  created_at: string;
}

/** password_hash is never selected, so it cannot leak into a response. */
const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.status, u.school_id,
         s.name AS school_name, u.created_at
    FROM users u
    LEFT JOIN schools s ON s.id = u.school_id`;

/**
 * Roles the institution must never be left without an active holder of.
 *
 * admin: nobody could administer the system.
 * iqac_head: nobody could approve pending accounts, so no newly created user
 * could ever sign in — the install would quietly deadlock.
 */
const IRREPLACEABLE: ReadonlyArray<Role> = ['admin', 'iqac_head'];

function getUserById(id: number): UserRow | undefined {
  return getDb().prepare(`${USER_SELECT} WHERE u.id = ?`).get(id) as
    | UserRow
    | undefined;
}

/** Holders of this role who can actually sign in right now. */
function activeRoleCount(role: Role): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = ? AND status = 'active'")
    .get(role) as { n: number };
  return row.n;
}

/**
 * Refuse a change that would remove the last active holder of an irreplaceable
 * role — whether by demoting them or by taking their account out of `active`.
 */
function lastHolderError(
  target: UserRow,
  nextRole: Role,
  nextStatus: UserStatus
): string | null {
  if (target.status !== 'active') return null;
  if (!IRREPLACEABLE.includes(target.role)) return null;

  const stillHolds = nextRole === target.role && nextStatus === 'active';
  if (stillHolds) return null;
  if (activeRoleCount(target.role) > 1) return null;

  const label = ROLE_LABEL[target.role];
  const verb = nextRole === target.role ? 'deactivate' : 'demote';
  return target.role === 'iqac_head'
    ? `Cannot ${verb} the last active ${label} — pending accounts could no longer be approved.`
    : `Cannot ${verb} the last active ${label}.`;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Validate an optional schoolId from a request body. */
function resolveSchoolId(
  raw: unknown
): { schoolId: number | null; error: null } | { schoolId: null; error: string } {
  if (raw === null || raw === '') return { schoolId: null, error: null };
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { schoolId: null, error: 'schoolId must be a valid school' };
  }
  const school = getDb()
    .prepare('SELECT id FROM schools WHERE id = ? AND active = 1')
    .get(n) as { id: number } | undefined;
  if (!school) {
    return { schoolId: null, error: 'That school does not exist or is not active' };
  }
  return { schoolId: n, error: null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireCan(request, 'user:update');
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

  let nextRole: Role = target.role;
  if (body.role !== undefined) {
    if (!isRole(body.role)) {
      return jsonError(`Role must be one of: ${ROLES.join(', ')}`, 400);
    }
    if (body.role !== target.role) {
      // Self-elevation turns one compromised session into a permanent foothold,
      // and self-demotion can strand the system with no active admin.
      if (target.id === user.id) {
        return jsonError(
          'You cannot change your own role. Ask another administrator to do it.',
          400
        );
      }
      nextRole = body.role;
      updates.push('role = ?');
      values.push(nextRole);
      changedFields.push('role');
    }
  }

  let nextStatus: UserStatus = target.status;
  if (body.status !== undefined) {
    if (!isUserStatus(body.status)) {
      return jsonError(`Status must be one of: ${USER_STATUSES.join(', ')}`, 400);
    }
    if (body.status !== target.status) {
      nextStatus = body.status;
      updates.push('status = ?');
      values.push(nextStatus);
      changedFields.push('status');
    }
  }

  let nextSchoolId = target.school_id;
  if (body.schoolId !== undefined) {
    const resolved = resolveSchoolId(body.schoolId);
    if (resolved.error) return jsonError(resolved.error, 400);
    if (resolved.schoolId !== target.school_id) {
      nextSchoolId = resolved.schoolId;
      updates.push('school_id = ?');
      values.push(nextSchoolId);
      changedFields.push('school');
    }
  }

  // A rep with no school has no scope: they could not write a single row.
  if (nextRole === 'school_rep' && nextSchoolId === null) {
    return jsonError('A school is required for a School Representative', 400);
  }

  const rail = lastHolderError(target, nextRole, nextStatus);
  if (rail) return jsonError(rail, 400);

  let passwordReset = false;
  if (body.password !== undefined) {
    const passwordError = validatePassword(body.password);
    if (passwordError) return jsonError(passwordError, 400);
    updates.push('password_hash = ?');
    values.push(await hashPassword(body.password as string));
    changedFields.push('password');
    passwordReset = true;
  }

  if (updates.length === 0) return jsonError('Nothing to update', 400);

  try {
    getDb()
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values, id);
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    // Partial unique index: at most one pending/active rep per school. Hit by
    // re-activating a disabled rep whose school has since been reassigned.
    if (message.includes('idx_one_rep_per_school')) {
      return jsonError(
        'This school already has a pending or active representative. Disable that account first.',
        409
      );
    }
    throw e;
  }

  // A password reset must not leave the old sessions alive; token_valid_from is
  // what stops an already-issued cookie from verifying.
  if (passwordReset) invalidateSessions(id);

  logAudit(user.id, null, null, 'user_updated', {
    userId: id,
    email: target.email,
    fields: changedFields,
    ...(changedFields.includes('role') ? { role: nextRole } : {}),
    ...(changedFields.includes('status') ? { status: nextStatus } : {}),
  });

  return NextResponse.json({ user: getUserById(id) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireCan(request, 'user:delete');
  if (error) return error;

  const id = parseId(params.id);
  if (id === null) return jsonError('User not found', 404);
  const target = getUserById(id);
  if (!target) return jsonError('User not found', 404);

  if (target.id === user.id) {
    return jsonError('You cannot delete your own account', 400);
  }
  if (
    target.status === 'active' &&
    IRREPLACEABLE.includes(target.role) &&
    activeRoleCount(target.role) <= 1
  ) {
    const label = ROLE_LABEL[target.role];
    return jsonError(
      target.role === 'iqac_head'
        ? `Cannot delete the last active ${label} — pending accounts could no longer be approved.`
        : `Cannot delete the last active ${label}.`,
      400
    );
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
    db.prepare('DELETE FROM user_criteria WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  remove(id);

  logAudit(user.id, null, null, 'user_deleted', {
    userId: id,
    email: target.email,
    role: target.role,
  });

  return NextResponse.json({ ok: true });
}
