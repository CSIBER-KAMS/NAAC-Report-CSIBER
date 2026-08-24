import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { jsonError, requireUser, resolveYear, yearWritable } from '@/lib/apiHelpers';
import { getMetric } from '@/catalog';

export const dynamic = 'force-dynamic';

export interface ChangeRequestRow {
  id: number;
  year_id: number;
  metric_id: string | null;
  source: string | null;
  note: string;
  status: 'open' | 'resolved';
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

/** GET /api/change-requests?year=2025-26[&status=open|resolved] */
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const { searchParams } = new URL(request.url);
  const year = resolveYear(searchParams.get('year'));
  if (!year) return jsonError('Year not found', 404);

  const status = searchParams.get('status');
  if (status !== null && status !== 'open' && status !== 'resolved') {
    return jsonError("status must be 'open' or 'resolved'", 400);
  }

  const params: unknown[] = [year.id];
  let sql = `SELECT cr.id, cr.year_id, cr.metric_id, cr.source, cr.note, cr.status,
                    cr.created_by, u.name AS created_by_name, cr.created_at,
                    cr.resolved_at, cr.resolution_note
             FROM change_requests cr
             LEFT JOIN users u ON u.id = cr.created_by
             WHERE cr.year_id = ?`;
  if (status) {
    sql += ' AND cr.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY cr.created_at DESC, cr.id DESC';

  const rows = getDb().prepare(sql).all(...params) as ChangeRequestRow[];
  return NextResponse.json({ changeRequests: rows });
}

/** POST /api/change-requests?year=2025-26  body { metricId?, source?, note } */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const { searchParams } = new URL(request.url);
  const year = resolveYear(searchParams.get('year'));
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
  const { metricId, source, note } = (body ?? {}) as {
    metricId?: unknown;
    source?: unknown;
    note?: unknown;
  };

  if (typeof note !== 'string' || note.trim() === '') {
    return jsonError('note is required', 400);
  }
  if (metricId !== undefined && metricId !== null) {
    if (typeof metricId !== 'string' || !getMetric(metricId)) {
      return jsonError('Unknown metric id', 400);
    }
  }
  if (source !== undefined && source !== null && typeof source !== 'string') {
    return jsonError('source must be a string', 400);
  }

  const cleanMetricId =
    typeof metricId === 'string' && metricId.trim() !== '' ? metricId : null;
  const cleanSource =
    typeof source === 'string' && source.trim() !== '' ? source.trim() : null;

  const result = getDb()
    .prepare(
      `INSERT INTO change_requests (year_id, metric_id, source, note, status, created_by)
       VALUES (?, ?, ?, ?, 'open', ?)`
    )
    .run(year.id, cleanMetricId, cleanSource, note.trim(), user.id);
  const id = Number(result.lastInsertRowid);

  logAudit(user.id, year.id, cleanMetricId, 'create_change_request', {
    id,
    source: cleanSource,
    note: note.trim(),
  });

  return NextResponse.json({ id }, { status: 201 });
}
