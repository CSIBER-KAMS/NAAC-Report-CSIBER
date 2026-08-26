import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit, type YearRow } from '@/lib/db';
import {
  criterionOf,
  jsonError,
  requireAuth,
  requireCan,
  yearWritable,
} from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

/** PATCH /api/change-requests/[id]  body { status: 'resolved', resolutionNote? } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate before touching the database, so an anonymous caller cannot
  // learn which change request ids exist by telling 404 apart from 401. The
  // capability check has to come later, once the row reveals its criterion.
  const gate = await requireAuth(request);
  if (gate.error) return gate.error;

  const id = Number.parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid change request id', 400);
  }

  const db = getDb();
  // The request's own metric_id is what decides the scope this resolution has
  // to be authorized against.
  const cr = db
    .prepare(
      'SELECT id, year_id, metric_id, status FROM change_requests WHERE id = ?'
    )
    .get(id) as
    | { id: number; year_id: number; metric_id: string | null; status: string }
    | undefined;
  if (!cr) return jsonError('Change request not found', 404);

  // A general request (no metric) carries no criterion, which `can()` treats as
  // out of scope for coordinators — only the unscoped roles may close those.
  const { user, error } = await requireCan(request, 'changeRequest:resolve', {
    criterion: criterionOf(cr.metric_id),
  });
  if (error) return error;

  const year = db
    .prepare('SELECT id, label, status FROM years WHERE id = ?')
    .get(cr.year_id) as YearRow | undefined;
  if (!year) return jsonError('Year not found', 404);
  if (!yearWritable(year)) {
    return jsonError('This year has been marked final; no further changes are allowed.', 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const { status, resolutionNote } = (body ?? {}) as {
    status?: unknown;
    resolutionNote?: unknown;
  };

  if (status !== 'resolved') {
    return jsonError("status must be 'resolved'", 400);
  }
  if (
    resolutionNote !== undefined &&
    resolutionNote !== null &&
    typeof resolutionNote !== 'string'
  ) {
    return jsonError('resolutionNote must be a string', 400);
  }
  if (cr.status === 'resolved') {
    return jsonError('Change request is already resolved', 409);
  }

  const cleanNote =
    typeof resolutionNote === 'string' && resolutionNote.trim() !== ''
      ? resolutionNote.trim()
      : null;

  db.prepare(
    `UPDATE change_requests
     SET status = 'resolved', resolved_at = datetime('now'), resolution_note = ?
     WHERE id = ?`
  ).run(cleanNote, id);

  logAudit(user.id, cr.year_id, cr.metric_id, 'resolve_change_request', {
    id,
    resolutionNote: cleanNote,
  });

  return NextResponse.json({ ok: true });
}
