import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireCan } from '@/lib/apiHelpers';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

const LABEL_RE = /^\d{4}-\d{2}$/;

interface YearListRow {
  id: number;
  label: string;
  status: 'draft' | 'final';
  created_at: string;
}

export async function GET(request: NextRequest) {
  const { error } = await requireCan(request, 'year:manage');
  if (error) return error;

  const years = getDb()
    .prepare('SELECT id, label, status, created_at FROM years ORDER BY label DESC')
    .all() as YearListRow[];

  return NextResponse.json({ years });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireCan(request, 'year:manage');
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!LABEL_RE.test(label)) {
    return jsonError("Label must match the format 'NNNN-NN', e.g. 2025-26", 400);
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM years WHERE label = ?')
    .get(label) as { id: number } | undefined;
  if (existing) {
    return jsonError('A year with this label already exists', 409);
  }

  const info = db.prepare('INSERT INTO years (label) VALUES (?)').run(label);
  const newId = Number(info.lastInsertRowid);

  logAudit(user.id, newId, null, 'year_created', { label });

  const created = db
    .prepare('SELECT id, label, status, created_at FROM years WHERE id = ?')
    .get(newId) as YearListRow;

  return NextResponse.json({ year: created }, { status: 201 });
}
