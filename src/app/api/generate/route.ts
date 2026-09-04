import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, logAudit, GENERATED_DIR } from '@/lib/db';
import { jsonError, requireAuth, resolveYear } from '@/lib/apiHelpers';
import { can } from '@/lib/permissions';
import { computeReadiness } from '@/lib/readiness';
import { generateAqar } from '@/lib/docgen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/generate  body { year, label? }
 *
 * Generation is allowed on final years too — it produces the FINAL document;
 * only data mutations are blocked once a year is final, so no yearWritable
 * guard here.
 *
 * Permission depends on WHICH document this produces: anyone who can edit the
 * AQAR may cut a draft for review, but the FINAL document is the artefact
 * submitted to NAAC, so it is restricted to the Admin and the Head of IQAC.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const { year: yearLabel, label, acknowledgeWarnings } = (body ?? {}) as {
    year?: unknown;
    label?: unknown;
    acknowledgeWarnings?: unknown;
  };

  if (typeof yearLabel !== 'string') return jsonError('year is required', 400);
  const year = resolveYear(yearLabel);
  if (!year) return jsonError('Year not found', 404);

  if (label !== undefined && label !== null && typeof label !== 'string') {
    return jsonError('label must be a string', 400);
  }
  const cleanLabel =
    typeof label === 'string' && label.trim() !== '' ? label.trim() : null;

  const draft = year.status !== 'final';
  if (!can(user, draft ? 'generate:draft' : 'generate:final')) {
    return jsonError(
      draft
        ? 'You do not have permission to generate the AQAR.'
        : 'Only the Administrator or the Head of IQAC may generate the FINAL AQAR document.',
      403
    );
  }

  // The readiness gate. A DRAFT is deliberately never blocked — circulating an
  // incomplete document is how the review loop works. The FINAL document is
  // what goes to NAAC, so it may not be produced over unresolved errors, and
  // the remaining warnings must be acknowledged rather than silently shipped.
  if (!draft) {
    const readiness = computeReadiness(year.id);
    if (!readiness.ready) {
      return jsonError(
        `The FINAL AQAR cannot be generated: ${readiness.blockedReason}. Clear these on the Generate AQAR page first.`,
        409
      );
    }
    if (readiness.warningCount > 0 && acknowledgeWarnings !== true) {
      return jsonError(
        `${readiness.warningCount} warning${readiness.warningCount === 1 ? '' : 's'} must be acknowledged before the FINAL AQAR is generated.`,
        409
      );
    }
  }

  const db = getDb();
  const { maxVersion } = db
    .prepare(
      'SELECT COALESCE(MAX(version), 0) AS maxVersion FROM generations WHERE year_id = ?'
    )
    .get(year.id) as { maxVersion: number };
  const version = maxVersion + 1;

  const buffer = await generateAqar(year.id, { draft, version });

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const fileName = `${year.label}-v${version}${draft ? '-draft' : ''}.docx`;
  const filePath = path.join(GENERATED_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  // Store the BARE FILENAME, not an absolute path. Absolute paths recorded on
  // one machine resolve to nothing on another (a Windows path is meaningless
  // on the Linux server), which previously broke every existing download.
  const result = db
    .prepare(
      `INSERT INTO generations (year_id, version, label, file_path, generated_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(year.id, version, cleanLabel, fileName, user.id);
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
