import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getDb, logAudit, UPLOADS_DIR, type YearRow } from '@/lib/db';
import { jsonError, requireUser, yearWritable } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

/** DELETE /api/evidence/[id] — remove the DB row and unlink the stored file. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid evidence id', 400);
  }

  const db = getDb();
  const row = db
    .prepare('SELECT * FROM evidence WHERE id = ?')
    .get(id) as EvidenceDbRow | undefined;
  if (!row) return jsonError('Evidence not found', 404);

  const year = db
    .prepare('SELECT id, label, status FROM years WHERE id = ?')
    .get(row.year_id) as YearRow | undefined;
  if (!year) return jsonError('Year not found', 404);
  if (!yearWritable(year)) {
    return jsonError('Year is marked final and cannot be modified', 409);
  }

  db.prepare('DELETE FROM evidence WHERE id = ?').run(id);

  // Unlink the stored file; tolerate a file that is already missing on disk.
  const root = path.resolve(UPLOADS_DIR);
  const absPath = path.resolve(path.join(UPLOADS_DIR, row.stored_path));
  if (absPath.startsWith(root + path.sep)) {
    try {
      fs.unlinkSync(absPath);
    } catch {
      // Missing file (or unreadable) — the DB row is gone, which is what matters.
    }
  }

  logAudit(user.id, year.id, row.metric_id, 'evidence_delete', {
    id: row.id,
    slot: row.slot_key,
    name: row.orig_name,
  });

  return NextResponse.json({ ok: true });
}
