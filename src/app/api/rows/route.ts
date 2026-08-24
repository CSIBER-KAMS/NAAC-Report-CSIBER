import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import {
  jsonError,
  requireUser,
  resolveYear,
  yearWritable,
} from '@/lib/apiHelpers';
import { getMetric } from '@/catalog/index';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const params = new URL(request.url).searchParams;
  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);
  if (!yearWritable(year)) {
    return jsonError('This year has been marked final; writes are locked.', 409);
  }

  const metricId = params.get('metric') ?? '';
  const lookup = getMetric(metricId);
  if (!lookup) return jsonError('Unknown metric', 404);

  const tableKey = params.get('table') ?? '';
  const table = (lookup.metric.tables ?? []).find((t) => t.key === tableKey);
  if (!table) return jsonError('Unknown table for this metric', 404);

  let body: { rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  if (!Array.isArray(body.rows)) {
    return jsonError('rows must be an array', 400);
  }

  // Keep only catalog columns; carry strings and numbers through as-is,
  // stringify anything else. No strict per-type validation in v1.
  const columnKeys = table.columns.map((c) => c.key);
  const cleaned: Record<string, string | number>[] = body.rows.map((raw) => {
    const row: Record<string, string | number> = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const key of columnKeys) {
        const v = (raw as Record<string, unknown>)[key];
        if (v === undefined || v === null) continue;
        row[key] = typeof v === 'number' && isFinite(v) ? v : String(v);
      }
    }
    return row;
  });

  const db = getDb();
  const del = db.prepare(
    'DELETE FROM table_rows WHERE year_id = ? AND metric_id = ? AND table_key = ?'
  );
  const ins = db.prepare(
    'INSERT INTO table_rows (year_id, metric_id, table_key, row_index, data) VALUES (?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    del.run(year.id, metricId, tableKey);
    cleaned.forEach((row, i) =>
      ins.run(year.id, metricId, tableKey, i, JSON.stringify(row))
    );
  })();

  logAudit(user.id, year.id, metricId, 'rows.replace', {
    table: tableKey,
    count: cleaned.length,
  });

  return NextResponse.json({ ok: true, count: cleaned.length });
}
