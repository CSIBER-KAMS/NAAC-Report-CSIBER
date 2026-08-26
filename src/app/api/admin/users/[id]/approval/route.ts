import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { jsonError, requireAuth } from '@/lib/apiHelpers';
import { canApproveAccounts, invalidateSessions } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/approval   body { decision: 'approve'|'reject', note? }
 *
 * Two-party control: the Administrator creates an account, but only the Head
 * of IQAC can bring it into service. That way no single person can both mint
 * an identity and authorise it.
 *
 * The Admin gets a break-glass path only when no active Head exists at all
 * (see canApproveAccounts) — without it, a fresh installation could deadlock
 * with nobody able to approve anybody.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (!canApproveAccounts(user)) {
    return jsonError(
      'Only the Head of IQAC can approve or reject accounts.',
      403
    );
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid user id', 400);
  }
  if (id === user.id) {
    return jsonError('You cannot approve your own account.', 400);
  }

  let body: { decision?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const decision = body.decision;
  if (decision !== 'approve' && decision !== 'reject') {
    return jsonError("decision must be 'approve' or 'reject'", 400);
  }
  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') {
    return jsonError('note must be a string', 400);
  }
  const note =
    typeof body.note === 'string' && body.note.trim() !== ''
      ? body.note.trim()
      : null;

  const db = getDb();
  const target = db
    .prepare('SELECT id, email, role, status FROM users WHERE id = ?')
    .get(id) as
    | { id: number; email: string; role: string; status: string }
    | undefined;
  if (!target) return jsonError('User not found', 404);

  const nextStatus = decision === 'approve' ? 'active' : 'rejected';
  if (target.status === nextStatus) {
    return NextResponse.json({ ok: true, status: nextStatus, unchanged: true });
  }

  db.prepare(
    `UPDATE users
        SET status = ?, approved_by = ?, approved_at = datetime('now'), decision_note = ?
      WHERE id = ?`
  ).run(nextStatus, user.id, note, id);

  // A rejected account must lose any session it somehow holds. Approval does
  // not need this: status is re-read from the database on every request, so a
  // newly approved user is live immediately.
  if (decision === 'reject') invalidateSessions(id);

  logAudit(
    user.id,
    null,
    null,
    decision === 'approve'
      ? user.role === 'admin'
        ? 'user_approved_breakglass'
        : 'user_approved'
      : 'user_rejected',
    { targetId: id, email: target.email, role: target.role, note }
  );

  return NextResponse.json({ ok: true, status: nextStatus });
}
