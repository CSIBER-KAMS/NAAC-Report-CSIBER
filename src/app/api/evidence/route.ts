import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getDb, logAudit, UPLOADS_DIR } from '@/lib/db';
import { jsonError, requireUser, resolveYear, yearWritable } from '@/lib/apiHelpers';
import { getMetric } from '@/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

interface EvidenceDbRow {
  id: number;
  year_id: number;
  metric_id: string;
  slot_key: string;
  orig_name: string;
  stored_path: string;
  size: number;
  mime: string | null;
  uploaded_by: number | null;
  uploaded_at: string;
}

function toApiRow(row: EvidenceDbRow) {
  return {
    id: row.id,
    yearId: row.year_id,
    metricId: row.metric_id,
    slotKey: row.slot_key,
    origName: row.orig_name,
    size: row.size,
    mime: row.mime,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

/**
 * Sanitize a single path component: no separators, no traversal, no
 * characters illegal on Windows, no leading dots. Never returns ''.
 */
function sanitizeComponent(input: string): string {
  const cleaned = input
    .replace(/[\\/]+/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"|?*\u0000-\u001f]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || 'file';
}

/** GET /api/evidence?year=&metric= — list evidence rows for a year (metric optional). */
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const { searchParams } = new URL(request.url);
  const year = resolveYear(searchParams.get('year'));
  if (!year) return jsonError('Year not found', 404);

  const metricId = searchParams.get('metric');
  const db = getDb();
  const rows = (
    metricId
      ? db
          .prepare(
            'SELECT * FROM evidence WHERE year_id = ? AND metric_id = ? ORDER BY slot_key, uploaded_at'
          )
          .all(year.id, metricId)
      : db
          .prepare(
            'SELECT * FROM evidence WHERE year_id = ? ORDER BY metric_id, slot_key, uploaded_at'
          )
          .all(year.id)
  ) as EvidenceDbRow[];

  return NextResponse.json({ evidence: rows.map(toApiRow) });
}

/** POST /api/evidence — multipart form: year, metric, slot, file. */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Expected multipart form data', 400);
  }

  const yearLabel = form.get('year');
  const metricId = form.get('metric');
  const slotKey = form.get('slot');
  const file = form.get('file');

  if (
    typeof yearLabel !== 'string' ||
    typeof metricId !== 'string' ||
    typeof slotKey !== 'string'
  ) {
    return jsonError('Fields year, metric and slot are required', 400);
  }
  if (!(file instanceof File)) {
    return jsonError('A file is required', 400);
  }

  const year = resolveYear(yearLabel);
  if (!year) return jsonError('Year not found', 404);
  if (!yearWritable(year)) {
    return jsonError('Year is marked final and cannot be modified', 409);
  }

  const lookup = getMetric(metricId);
  if (!lookup) return jsonError(`Unknown metric: ${metricId}`, 400);
  const slot = (lookup.metric.evidence ?? []).find((s) => s.key === slotKey);
  if (!slot) {
    return jsonError(`Metric ${metricId} has no evidence slot '${slotKey}'`, 400);
  }

  if (file.size === 0) return jsonError('File is empty', 400);
  if (file.size > MAX_FILE_SIZE) {
    return jsonError('File exceeds the 50 MB size limit', 413);
  }

  const origName = sanitizeComponent(file.name || 'file');
  const dirParts = [
    sanitizeComponent(year.label),
    sanitizeComponent(metricId),
    sanitizeComponent(slotKey),
  ];
  const storedName = `${Date.now()}-${origName}`;
  const relPath = [...dirParts, storedName].join('/');

  const absDir = path.join(UPLOADS_DIR, ...dirParts);
  const absPath = path.join(absDir, storedName);
  // Defence in depth: the final path must stay inside UPLOADS_DIR.
  const root = path.resolve(UPLOADS_DIR);
  if (!path.resolve(absPath).startsWith(root + path.sep)) {
    return jsonError('Invalid file path', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(absDir, { recursive: true });
  fs.writeFileSync(absPath, buffer);

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO evidence (year_id, metric_id, slot_key, orig_name, stored_path, size, mime, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      year.id,
      metricId,
      slotKey,
      origName,
      relPath,
      buffer.length,
      file.type || null,
      user.id
    );

  logAudit(user.id, year.id, metricId, 'evidence_upload', {
    slot: slotKey,
    name: origName,
    size: buffer.length,
  });

  const row = db
    .prepare('SELECT * FROM evidence WHERE id = ?')
    .get(result.lastInsertRowid) as EvidenceDbRow;

  return NextResponse.json({ evidence: toApiRow(row) }, { status: 201 });
}
