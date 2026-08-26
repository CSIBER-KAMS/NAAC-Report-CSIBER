import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, clearedSessionCookie } from '@/lib/sessionSecret';
import { getSessionUser } from '@/lib/session';
import { logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Sign out. Always clears the cookie, even if the session was already invalid
 * — this route is exempt from the middleware auth check for exactly that
 * reason, since previously logging out with an expired cookie returned a 401
 * and left the stale cookie in place.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser().catch(() => null);
  if (user) logAudit(user.id, null, null, 'logout');

  const res = NextResponse.redirect(new URL('/login', request.url), 303);
  res.cookies.set(SESSION_COOKIE, '', clearedSessionCookie());
  return res;
}
