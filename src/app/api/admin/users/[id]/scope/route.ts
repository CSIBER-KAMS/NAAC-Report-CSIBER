import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { jsonError, requireCan } from '@/lib/apiHelpers';
import { CRITERION_SCOPED, SCHOOL_SCOPED, type Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/users/[id]/scope   body { criteria?: number[], schoolId?: number|null }
 *
 * Sets what a scoped account may reach: which criteria a Criterion
 * Coordinator owns (any subset — all, one, or a custom combination), and which
 * school a School Representative belongs to.
 *
 * This is the Head of IQAC's decision, deliberately separate from the
 * Administrator's job of creating the account in the first place.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireCan(request, 'user:assign');
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid user id', 400);
  }

  let body: { criteria?: unknown; schoolId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const db = getDb();
  const target = db
    .prepare('SELECT id, email, role, school_id FROM users WHERE id = ?')
    .get(id) as
    | { id: number; email: string; role: Role; school_id: number | null }
    | undefined;
  if (!target) return jsonError('User not found', 404);

  /* ---------------- criteria ---------------- */
  let criteria: number[] | undefined;
  if (body.criteria !== undefined) {
    if (!Array.isArray(body.criteria)) {
      return jsonError('criteria must be an array of numbers 0-7', 400);
    }
    const parsed = body.criteria.map(Number);
    if (parsed.some((n) => !Number.isInteger(n) || n < 0 || n > 7)) {
      return jsonError(
        'criteria must contain whole numbers between 0 and 7 (0 = Extended Profile)',
        400
      );
    }
    if (!CRITERION_SCOPED.has(target.role)) {
      return jsonError(
        `${target.role} accounts already reach every criterion; assignments apply to coordinators and school representatives only.`,
        400
      );
    }
    criteria = Array.from(new Set(parsed)).sort((a, b) => a - b);
  }

  /* ---------------- school ---------------- */
  let schoolId: number | null | undefined;
  if (body.schoolId !== undefined) {
    if (body.schoolId === null) {
      if (SCHOOL_SCOPED.has(target.role)) {
        return jsonError(
          'A School Representative must be attached to a school.',
          400
        );
      }
      schoolId = null;
    } else {
      const n = Number(body.schoolId);
      if (!Number.isInteger(n) || n <= 0) {
        return jsonError('schoolId must be a positive integer or null', 400);
      }
      const school = db
        .prepare('SELECT id FROM schools WHERE id = ? AND active = 1')
        .get(n) as { id: number } | undefined;
      if (!school) return jsonError('Unknown or inactive school', 400);
      schoolId = n;
    }
  }

  try {
    db.transaction(() => {
      if (criteria !== undefined) {
        db.prepare('DELETE FROM user_criteria WHERE user_id = ?').run(id);
        const ins = db.prepare(
          'INSERT INTO user_criteria (user_id, criterion) VALUES (?, ?)'
        );
        for (const c of criteria) ins.run(id, c);
      }
      if (schoolId !== undefined) {
        db.prepare('UPDATE users SET school_id = ? WHERE id = ?').run(
          schoolId,
          id
        );
      }
    })();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('idx_one_rep_per_school')) {
      return jsonError(
        'That school already has an active School Representative.',
        409
      );
    }
    throw e;
  }

  logAudit(user.id, null, null, 'user_scope_updated', {
    targetId: id,
    email: target.email,
    criteria,
    schoolId,
  });

  const now = (
    db
      .prepare(
        'SELECT criterion FROM user_criteria WHERE user_id = ? ORDER BY criterion'
      )
      .all(id) as { criterion: number }[]
  ).map((r) => r.criterion);

  return NextResponse.json({ ok: true, criteria: now, schoolId });
}
