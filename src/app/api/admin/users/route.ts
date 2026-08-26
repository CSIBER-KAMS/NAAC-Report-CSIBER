import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireCan } from '@/lib/apiHelpers';
import { hashPassword, validatePassword } from '@/lib/auth';
import { isRole, NEEDS_APPROVAL, ROLES, type Role, type UserStatus } from '@/lib/roles';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UserListRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  school_id: number | null;
  school_name: string | null;
  created_at: string;
}

/**
 * The public shape of a user. password_hash is never selected, so it cannot
 * leak into a response by accident.
 */
const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.status, u.school_id,
         s.name AS school_name, u.created_at
    FROM users u
    LEFT JOIN schools s ON s.id = u.school_id`;

export async function GET(request: NextRequest) {
  const { error } = await requireCan(request, 'user:list');
  if (error) return error;

  const users = getDb()
    .prepare(`${USER_SELECT} ORDER BY u.name COLLATE NOCASE`)
    .all() as UserListRow[];

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireCan(request, 'user:create');
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

  if (!name) return jsonError('Name is required', 400);
  if (!email || !email.includes('@')) {
    return jsonError('A valid email is required', 400);
  }

  const passwordError = validatePassword(body.password);
  if (passwordError) return jsonError(passwordError, 400);
  const password = body.password as string;

  if (!isRole(body.role)) {
    return jsonError(`Role must be one of: ${ROLES.join(', ')}`, 400);
  }
  const role: Role = body.role;

  const db = getDb();

  // A school representative is meaningless without a school: their whole
  // permission scope is "rows tagged with my school".
  let schoolId: number | null = null;
  const schoolRaw = body.schoolId;
  const schoolProvided = schoolRaw !== undefined && schoolRaw !== null && schoolRaw !== '';
  if (schoolProvided) {
    const n = typeof schoolRaw === 'number' ? schoolRaw : Number(schoolRaw);
    if (!Number.isInteger(n) || n <= 0) {
      return jsonError('schoolId must be a valid school', 400);
    }
    const school = db
      .prepare('SELECT id FROM schools WHERE id = ? AND active = 1')
      .get(n) as { id: number } | undefined;
    if (!school) {
      return jsonError('That school does not exist or is not active', 400);
    }
    schoolId = n;
  } else if (role === 'school_rep') {
    return jsonError('A school is required for a School Representative', 400);
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as { id: number } | undefined;
  if (existing) {
    return jsonError('A user with this email already exists', 409);
  }

  // Roles that answer to the Head of IQAC start pending; admin and iqac_head
  // have no higher authority to approve them, so they start active.
  const status: UserStatus = NEEDS_APPROVAL.has(role) ? 'pending' : 'active';
  const passwordHash = await hashPassword(password);

  let newId: number;
  try {
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, status, school_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, role, status, schoolId, user.id);
    newId = Number(info.lastInsertRowid);
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    // Partial unique index: at most one pending/active rep per school.
    if (message.includes('idx_one_rep_per_school')) {
      return jsonError(
        'This school already has a pending or active representative. Disable that account before adding another.',
        409
      );
    }
    if (message.includes('users.email')) {
      return jsonError('A user with this email already exists', 409);
    }
    throw e;
  }

  logAudit(user.id, null, null, 'user_created', {
    userId: newId,
    email,
    role,
    status,
  });

  const created = db
    .prepare(`${USER_SELECT} WHERE u.id = ?`)
    .get(newId) as UserListRow;

  return NextResponse.json({ user: created }, { status: 201 });
}
