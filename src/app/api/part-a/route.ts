import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import {
  jsonError,
  requireAuth,
  requireCan,
  resolveYear,
  yearWritable,
} from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

function loadPayload(yearId: number): Record<string, unknown> {
  const row = getDb()
    .prepare('SELECT payload FROM part_a WHERE year_id = ?')
    .get(yearId) as { payload: string } | undefined;
  return row ? JSON.parse(row.payload) : {};
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);

  return NextResponse.json({ payload: loadPayload(year.id) });
}

export async function PUT(request: NextRequest) {
  // Part A is institution-level data, so it is not criterion-scoped.
  const { user, error } = await requireCan(request, 'partA:edit');
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);
  if (!yearWritable(year)) {
    return jsonError('This year has been marked final; writes are locked.', 409);
  }

  let body: { payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  if (
    typeof body.payload !== 'object' ||
    body.payload === null ||
    Array.isArray(body.payload)
  ) {
    return jsonError('payload must be an object', 400);
  }

  const incoming = body.payload as Record<string, unknown>;
  const merged = { ...loadPayload(year.id), ...incoming };

  getDb()
    .prepare(
      `INSERT INTO part_a (year_id, payload, updated_by, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (year_id) DO UPDATE SET
         payload = excluded.payload,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    )
    .run(year.id, JSON.stringify(merged), user.id);

  logAudit(user.id, year.id, null, 'part_a.update', {
    fields: Object.keys(incoming),
  });

  return NextResponse.json({ ok: true, payload: merged });
}
