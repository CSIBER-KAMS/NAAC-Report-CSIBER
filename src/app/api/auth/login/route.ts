import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { logAudit } from '@/lib/db';

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const token = await createSessionToken(user);
  logAudit(user.id, null, null, 'login');
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return res;
}
