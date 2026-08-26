import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { jsonError, requireCan } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

function schoolRepCount(id: number): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS c FROM users
          WHERE school_id = ? AND role = 'school_rep'
            AND status IN ('pending','active')`
      )
      .get(id) as { c: number }
  ).c;
}

/** PATCH /api/admin/schools/[id]  body { name?, code?, active? } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireCan(request, 'school:manage');
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid school id', 400);
  }

  let body: { name?: unknown; code?: unknown; active?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT id, name FROM schools WHERE id = ?')
    .get(id) as { id: number; name: string } | undefined;
  if (!existing) return jsonError('School not found', 404);

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name === '') return jsonError('School name cannot be empty', 400);
    sets.push('name = ?');
    values.push(name);
  }
  if (body.code !== undefined) {
    sets.push('code = ?');
    values.push(
      typeof body.code === 'string' && body.code.trim() !== ''
        ? body.code.trim()
        : null
    );
  }
  if (body.active !== undefined) {
    const active = body.active ? 1 : 0;
    // Deactivating a school with representatives attached would leave those
    // accounts pointing at something the UI no longer offers, so block it and
    // say what to do instead.
    if (active === 0 && schoolRepCount(id) > 0) {
      return jsonError(
        'This school still has a School Representative. Reassign or disable that account first.',
        409
      );
    }
    sets.push('active = ?');
    values.push(active);
  }

  if (sets.length === 0) return jsonError('Nothing to update', 400);

  try {
    db.prepare(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`).run(
      ...values,
      id
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('UNIQUE')) {
      return jsonError('A school with that name already exists.', 409);
    }
    throw e;
  }

  logAudit(user.id, null, null, 'school_updated', { id, changes: body });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/schools/[id] — only when nothing references it. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireCan(request, 'school:manage');
  if (error) return error;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('Invalid school id', 400);
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT id, name FROM schools WHERE id = ?')
    .get(id) as { id: number; name: string } | undefined;
  if (!existing) return jsonError('School not found', 404);

  const users = (
    db
      .prepare('SELECT COUNT(*) AS c FROM users WHERE school_id = ?')
      .get(id) as { c: number }
  ).c;
  if (users > 0) {
    return jsonError(
      'This school has accounts attached. Reassign them before deleting it, or mark the school inactive instead.',
      409
    );
  }

  const rows = (
    db
      .prepare('SELECT COUNT(*) AS c FROM table_rows WHERE school_id = ?')
      .get(id) as { c: number }
  ).c;
  if (rows > 0) {
    return jsonError(
      'This school has contributed AQAR data. Mark it inactive instead of deleting it, so the data keeps its attribution.',
      409
    );
  }

  db.prepare('DELETE FROM schools WHERE id = ?').run(id);
  logAudit(user.id, null, null, 'school_deleted', {
    id,
    name: existing.name,
  });
  return NextResponse.json({ ok: true });
}
