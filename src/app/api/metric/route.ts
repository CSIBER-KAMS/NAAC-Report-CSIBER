import { NextRequest, NextResponse } from 'next/server';
import { getDb, getMetricPayload, getTableRows, logAudit } from '@/lib/db';
import {
  jsonError,
  requireUser,
  resolveYear,
  yearWritable,
} from '@/lib/apiHelpers';
import {
  effectiveHeadline,
  validateMetric,
  type EvidenceCount,
} from '@/lib/derive';
import { getMetric } from '@/catalog/index';
import type { Metric, MetricPayload, MetricStatus } from '@/catalog/types';

export const dynamic = 'force-dynamic';

const METRIC_STATUSES: MetricStatus[] = ['empty', 'in_progress', 'complete'];

interface EvidenceRow {
  id: number;
  slot_key: string;
  orig_name: string;
  size: number;
  uploaded_at: string;
}

function loadEvidence(yearId: number, metricId: string): EvidenceRow[] {
  return getDb()
    .prepare(
      'SELECT id, slot_key, orig_name, size, uploaded_at FROM evidence WHERE year_id = ? AND metric_id = ? ORDER BY uploaded_at, id'
    )
    .all(yearId, metricId) as EvidenceRow[];
}

/** Full GET-shape state for one metric in one year. */
function metricState(yearId: number, metric: Metric) {
  const { payload, status } = getMetricPayload(yearId, metric.id);
  const p = payload as MetricPayload;

  const rows: Record<string, Record<string, unknown>[]> = {};
  for (const table of metric.tables ?? []) {
    rows[table.key] = getTableRows(yearId, metric.id, table.key);
  }

  const evidence = loadEvidence(yearId, metric.id);
  const evidenceCounts: EvidenceCount = {};
  for (const e of evidence) {
    evidenceCounts[e.slot_key] = (evidenceCounts[e.slot_key] ?? 0) + 1;
  }

  const value = metric.headline ? effectiveHeadline(yearId, metric, p) : null;
  const issues = validateMetric(yearId, metric, p, evidenceCounts);

  return { payload: p, status, rows, evidence, derived: { value }, issues };
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const params = new URL(request.url).searchParams;
  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);

  const id = params.get('id') ?? '';
  const lookup = getMetric(id);
  if (!lookup) return jsonError('Unknown metric', 404);

  return NextResponse.json(metricState(year.id, lookup.metric));
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const params = new URL(request.url).searchParams;
  const year = resolveYear(params.get('year'));
  if (!year) return jsonError('Unknown year', 404);
  if (!yearWritable(year)) {
    return jsonError('This year has been marked final; writes are locked.', 409);
  }

  const id = params.get('id') ?? '';
  const lookup = getMetric(id);
  if (!lookup) return jsonError('Unknown metric', 404);
  const metric = lookup.metric;

  let body: { payload?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  if (
    body.payload !== undefined &&
    (typeof body.payload !== 'object' ||
      body.payload === null ||
      Array.isArray(body.payload))
  ) {
    return jsonError('payload must be an object', 400);
  }
  if (
    body.status !== undefined &&
    !METRIC_STATUSES.includes(body.status as MetricStatus)
  ) {
    return jsonError('status must be one of empty | in_progress | complete', 400);
  }

  const existing = getMetricPayload(year.id, metric.id);
  const incoming = (body.payload ?? {}) as Record<string, unknown>;
  const merged = { ...existing.payload, ...incoming };
  const status = (body.status as MetricStatus | undefined) ?? existing.status;

  getDb()
    .prepare(
      `INSERT INTO metric_values (year_id, metric_id, payload, status, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (year_id, metric_id) DO UPDATE SET
         payload = excluded.payload,
         status = excluded.status,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    )
    .run(year.id, metric.id, JSON.stringify(merged), status, user.id);

  logAudit(user.id, year.id, metric.id, 'metric.update', {
    fields: Object.keys(incoming),
    status,
  });

  return NextResponse.json(metricState(year.id, metric));
}
