import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  SESSION_COOKIE,
  sessionSecret,
  clearedSessionCookie,
} from '@/lib/sessionSecret';

/**
 * Edge gate. Runs before every request.
 *
 * Scope is deliberately narrow: is there a validly-signed, unexpired cookie,
 * and where should this request go? It answers NOTHING about who the user is
 * or what they may do — the edge runtime cannot reach the database, so role
 * and status are resolved in lib/session.ts on the node side instead. Trying
 * to decide authorization here is what let a stale token carry stale
 * privileges in the first place.
 */

const EXEMPT = [
  '/api/auth/login',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EXEMPT.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  /* ------------------------------------------------------------------ *
   * /login always signs you out.
   *
   * This is the fix for "the system should not be based on which account is
   * logged in to that browser". Previously /login was exempted before the
   * cookie was even read, and the cookie was only replaced by a SUCCESSFUL
   * login — so arriving at the login page, or failing a login, left the
   * previous session fully alive underneath.
   *
   * Clearing on arrival is deterministic, needs no database, and makes
   * account switching work. Redirecting an authenticated user away instead
   * would preserve the very session that causes the confusion.
   * ------------------------------------------------------------------ */
  if (pathname.startsWith('/login')) {
    const hasCookie = request.cookies.has(SESSION_COOKIE);
    const isPrefetch =
      request.headers.get('next-router-prefetch') === '1' ||
      request.headers.get('purpose') === 'prefetch';

    if (hasCookie && request.method === 'GET' && !isPrefetch) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '?signedout=1';
      const res = NextResponse.redirect(url);
      // Same attributes as when it was set, or the browser keeps it.
      res.cookies.set(SESSION_COOKIE, '', clearedSessionCookie());
      // Loop-safe: the next request has no cookie, so this branch cannot
      // fire again.
      return res;
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, sessionSecret());
      return NextResponse.next();
    } catch {
      /* fall through — expired, tampered, or signed with a rotated secret */
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = '/login';
  login.search = token ? '?expired=1' : '';
  const res = NextResponse.redirect(login);
  // An invalid cookie is cleared on the way out so it cannot linger and
  // trigger the /login branch on the very next request.
  if (token) res.cookies.set(SESSION_COOKIE, '', clearedSessionCookie());
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
