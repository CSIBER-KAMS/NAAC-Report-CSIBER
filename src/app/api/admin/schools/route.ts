import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { jsonError, requireCan } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export interface SchoolRow {
  id: number;
  name: string;
  code: string | null;
  active: number;
  created_at: string;
  rep_count: number;
}

/** GET /api/admin/schools — list schools with how many representatives each has. */
export async function GET(request: NextRequest) {
  const { error } = await requireCan(request, 'school:manage');
  if (error) return error;

  const schools = getDb()
    .prepare(
      `SELECT s.id, s.name, s.code, s.active, s.created_at,
              (SELECT COUNT(*) FROM users u
                WHERE u.school_id = s.id
                  AND u.role = 'school_rep'
                  AND u.status IN ('pending','active')) AS rep_count
         FROM schools s
        ORDER BY s.name COLLATE NOCASE`
    )
    .all() as SchoolRow[];

  return NextResponse.json({ schools });
}

/** POST /api/admin/schools  body { name, code? } */
export async function POST(request: NextRequest) {
  const { user, error } = await requireCan(request, 'school:manage');
  if (error) return error;

  let body: { name?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name === '') return jsonError('School name is required', 400);
  if (name.length > 200) {
    return jsonError('School name is too long (max 200 characters)', 400);
  }
  const code =
    typeof body.code === 'string' && body.code.trim() !== ''
      ? body.code.trim()
      : null;

  const db = getDb();
  try {
    const result = db
      .prepare('INSERT INTO schools (name, code) VALUES (?, ?)')
      .run(name, code);
    const id = Number(result.lastInsertRowid);
    logAudit(user.id, null, null, 'school_created', { id, name, code });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('UNIQUE')) {
      return jsonError('A school with that name already exists.', 409);
    }
    throw e;
  }
}
