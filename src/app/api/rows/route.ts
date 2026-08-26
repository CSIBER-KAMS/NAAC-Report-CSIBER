import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import {
  criterionOf,
  jsonError,
  requireCan,
  resolveYear,
  yearWritable,
} from '@/lib/apiHelpers';
import { isSchoolScoped } from '@/lib/permissions';
import { getMetric } from '@/catalog/index';

export const dynamic = 'force-dynamic';

interface StoredRow {
  id: number;
  row_index: number;
  school_id: number | null;
  created_by: number | null;
}

/**
 * Replace the rows of one metric table.
 *
 * This used to be an unconditional "delete every row for this metric+table,
 * then re-insert what the client sent". That is safe when one person owns the
 * whole table, but School Representatives contribute to shared tables scoped
 * to their own school — under the old behaviour, one representative pressing
 * Save would silently erase every other school's rows.
 *
 * So the write is now ownership-preserving: a school-scoped user replaces only
 * the rows tagged with their own school, and rows belonging to other schools
 * (or to the unscoped roles) are left exactly as they were.
 */
export async function PUT(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const metricId = params.get('metric') ?? '';
  const criterion = criterionOf(metricId);

  const { user, error } = await requireCan(request, 'metric:edit', { criterion });
  if (error) return error;

  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);
  if (!yearWritable(year)) {
    return jsonError('This year has been marked final; writes are locked.', 409);
  }

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

  const scoped = isSchoolScoped(user);
  if (scoped && user.schoolId == null) {
    return jsonError(
      'Your account is not attached to a school, so it cannot contribute data. Contact the IQAC office.',
      403
    );
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

  const existing = db
    .prepare(
      `SELECT id, row_index, school_id, created_by
         FROM table_rows
        WHERE year_id = ? AND metric_id = ? AND table_key = ?
        ORDER BY row_index`
    )
    .all(year.id, metricId, tableKey) as StoredRow[];

  // Which of the existing rows is this save allowed to replace?
  const replaceable = scoped
    ? existing.filter((r) => r.school_id === user.schoolId)
    : existing;
  const untouched = scoped
    ? existing.filter((r) => r.school_id !== user.schoolId)
    : [];

  const delById = db.prepare('DELETE FROM table_rows WHERE id = ?');
  const ins = db.prepare(
    `INSERT INTO table_rows
       (year_id, metric_id, table_key, row_index, data, school_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const reindex = db.prepare('UPDATE table_rows SET row_index = ? WHERE id = ?');

  db.transaction(() => {
    for (const r of replaceable) delById.run(r.id);

    // Rows this user may not touch keep their relative order and are packed
    // to the front, so row_index stays contiguous across the whole table.
    let index = 0;
    for (const r of untouched) reindex.run(index++, r.id);

    for (const row of cleaned) {
      ins.run(
        year.id,
        metricId,
        tableKey,
        index++,
        JSON.stringify(row),
        scoped ? user.schoolId : null,
        user.id
      );
    }
  })();

  logAudit(user.id, year.id, metricId, 'rows.replace', {
    table: tableKey,
    count: cleaned.length,
    scopedToSchool: scoped ? user.schoolId : null,
    preserved: untouched.length,
  });

  return NextResponse.json({
    ok: true,
    count: cleaned.length,
    preserved: untouched.length,
  });
}
