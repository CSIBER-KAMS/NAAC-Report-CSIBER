import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fileNameOf, getDb, GENERATED_DIR } from '@/lib/db';
import { jsonError, requireAuth } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** GET /api/generations/[id]/download — stream the generated .docx. */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

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

  // file_path used to be absolute and is now a bare filename; reducing it to
  // its basename first makes this work with rows written either way.
  const abs = path.resolve(path.join(GENERATED_DIR, fileNameOf(row.file_path)));
  if (!abs.startsWith(path.resolve(GENERATED_DIR) + path.sep)) {
    return jsonError('Invalid path', 400);
  }

  if (!fs.existsSync(abs)) {
    return jsonError('Generated file is missing on disk', 404);
  }
  const buffer = fs.readFileSync(abs);
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
