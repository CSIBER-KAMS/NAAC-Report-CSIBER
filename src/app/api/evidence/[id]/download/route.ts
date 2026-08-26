import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getDb, UPLOADS_DIR } from '@/lib/db';
import { jsonError, requireAuth } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EvidenceFileRow {
  id: number;
  orig_name: string;
  stored_path: string;
  size: number;
  mime: string | null;
}

/**
 * Build a safe Content-Disposition header for the original filename.
 * The stored name is already sanitized at upload time; this is defence in
 * depth against header injection (quotes, control characters, non-ASCII).
 */
function contentDisposition(filename: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = filename.replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'file';
  const ascii = cleaned.replace(/["\\]/g, '_').replace(/[^\u0020-\u007e]/g, '_');
  const encoded = encodeURIComponent(cleaned);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** GET /api/evidence/[id]/download — stream the file with its original name. */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid evidence id', 400);
  }

  const row = getDb()
    .prepare('SELECT id, orig_name, stored_path, size, mime FROM evidence WHERE id = ?')
    .get(id) as EvidenceFileRow | undefined;
  if (!row) return jsonError('Evidence not found', 404);

  const root = path.resolve(UPLOADS_DIR);
  const absPath = path.resolve(path.join(UPLOADS_DIR, row.stored_path));
  if (!absPath.startsWith(root + path.sep)) {
    return jsonError('Invalid file path', 400);
  }

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(absPath);
  } catch {
    return jsonError('File is missing on disk', 404);
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': row.mime || 'application/octet-stream',
      'Content-Length': String(buffer.length),
      'Content-Disposition': contentDisposition(row.orig_name),
      'Cache-Control': 'no-store',
    },
  });
}
