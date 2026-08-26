import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireCan, resolveYear } from '@/lib/apiHelpers';
import { buildDataTemplates } from '@/lib/xlsxExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** GET /api/export-templates?year=2025-26 — stream the NAAC data-template workbook. */
export async function GET(request: NextRequest) {
  const { error } = await requireCan(request, 'export:xlsx');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const year = resolveYear(searchParams.get('year'));
  if (!year) return jsonError('Year not found', 404);

  const buffer = await buildDataTemplates(year.id);
  const fileName = `AQAR-data-templates-${year.label}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
