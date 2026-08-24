import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, logAudit, GENERATED_DIR } from '@/lib/db';
import { jsonError, requireUser, resolveYear } from '@/lib/apiHelpers';
import { generateAqar } from '@/lib/docgen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/generate  body { year, label? }
 *
 * Generation is allowed on final years too — it produces the FINAL document;
 * only data mutations are blocked once a year is final, so no yearWritable
 * guard here.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const { year: yearLabel, label } = (body ?? {}) as {
    year?: unknown;
    label?: unknown;
  };

  if (typeof yearLabel !== 'string') return jsonError('year is required', 400);
  const year = resolveYear(yearLabel);
  if (!year) return jsonError('Year not found', 404);

  if (label !== undefined && label !== null && typeof label !== 'string') {
    return jsonError('label must be a string', 400);
  }
  const cleanLabel =
    typeof label === 'string' && label.trim() !== '' ? label.trim() : null;

  const db = getDb();
  const { maxVersion } = db
    .prepare(
      'SELECT COALESCE(MAX(version), 0) AS maxVersion FROM generations WHERE year_id = ?'
    )
    .get(year.id) as { maxVersion: number };
  const version = maxVersion + 1;

  const draft = year.status !== 'final';
  const buffer = await generateAqar(year.id, { draft, version });

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const fileName = `${year.label}-v${version}${draft ? '-draft' : ''}.docx`;
  const filePath = path.join(GENERATED_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  const result = db
    .prepare(
      `INSERT INTO generations (year_id, version, label, file_path, generated_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(year.id, version, cleanLabel, filePath, user.id);
  const id = Number(result.lastInsertRowid);

  logAudit(user.id, year.id, null, 'generate_aqar', {
    id,
    version,
    draft,
    label: cleanLabel,
    fileName,
  });

  return NextResponse.json({ id, version }, { status: 201 });
}
