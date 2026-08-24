import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireUser } from '@/lib/apiHelpers';
import type { SessionUser } from '@/lib/auth';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface YearRow {
  id: number;
  label: string;
  status: 'draft' | 'final';
  created_at: string;
}

async function requireAdmin(): Promise<
  { user: SessionUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await requireUser();
  if (!user) return { user: null, error: jsonError('Not authenticated', 401) };
  if (user.role !== 'admin') {
    return { user: null, error: jsonError('Admin access required', 403) };
  }
  return { user, error: null };
}

function getYearById(id: number): YearRow | undefined {
  return getDb()
    .prepare('SELECT id, label, status, created_at FROM years WHERE id = ?')
    .get(id) as YearRow | undefined;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const id = parseId(params.id);
  if (id === null) return jsonError('Year not found', 404);
  const year = getYearById(id);
  if (!year) return jsonError('Year not found', 404);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const status = body.status;
  if (status !== 'final' && status !== 'draft') {
    return jsonError("status must be 'final' or 'draft'", 400);
  }

  if (status === year.status) {
    // Idempotent no-op; nothing to change or audit.
    return NextResponse.json({ year });
  }

  getDb().prepare('UPDATE years SET status = ? WHERE id = ?').run(status, id);

  logAudit(
    user.id,
    id,
    null,
    status === 'final' ? 'year_finalized' : 'year_reopened',
    { label: year.label }
  );

  return NextResponse.json({ year: getYearById(id) });
}
