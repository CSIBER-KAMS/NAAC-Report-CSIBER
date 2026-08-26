import { NextRequest, NextResponse } from 'next/server';
import { fileNameOf, getDb } from '@/lib/db';
import { jsonError, requireAuth, resolveYear } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export interface GenerationRow {
  id: number;
  year_id: number;
  version: number;
  label: string | null;
  file_name: string;
  generated_by: number | null;
  generated_by_name: string | null;
  created_at: string;
}

/** GET /api/generations?year=2025-26 — newest first. */
export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const year = resolveYear(searchParams.get('year'));
  if (!year) return jsonError('Year not found', 404);

  const rows = getDb()
    .prepare(
      `SELECT g.id, g.year_id, g.version, g.label, g.file_path,
              g.generated_by, u.name AS generated_by_name, g.created_at
       FROM generations g
       LEFT JOIN users u ON u.id = g.generated_by
       WHERE g.year_id = ?
       ORDER BY g.version DESC, g.id DESC`
    )
    .all(year.id) as (Omit<GenerationRow, 'file_name'> & { file_path: string })[];

  // Legacy rows hold an absolute Windows path; path.basename would not split it
  // on a Linux host, so use the separator-agnostic helper.
  const generations: GenerationRow[] = rows.map(({ file_path, ...rest }) => ({
    ...rest,
    file_name: fileNameOf(file_path),
  }));

  return NextResponse.json({ generations });
}
