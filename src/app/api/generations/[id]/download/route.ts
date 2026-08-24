import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDb } from '@/lib/db';
import { jsonError, requireUser } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** GET /api/generations/[id]/download — stream the generated .docx. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) return jsonError('Not authenticated', 401);

  const id = Number.parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid generation id', 400);
  }

  const row = getDb()
    .prepare(
      `SELECT g.id, g.version, g.file_path, y.label AS year_label
       FROM generations g
       JOIN years y ON y.id = g.year_id
       WHERE g.id = ?`
    )
    .get(id) as
    | { id: number; version: number; file_path: string; year_label: string }
    | undefined;
  if (!row) return jsonError('Generation not found', 404);

  if (!fs.existsSync(row.file_path)) {
    return jsonError('Generated file is missing on disk', 404);
  }
  const buffer = fs.readFileSync(row.file_path);
  const fileName = `AQAR-${row.year_label}-v${row.version}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': DOCX_MIME,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
