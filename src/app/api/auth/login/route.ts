import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionToken } from '@/lib/auth';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  clearedSessionCookie,
  SESSION_MAX_AGE,
} from '@/lib/sessionSecret';
import { logAudit } from '@/lib/db';
import {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
  clientIp,
} from '@/lib/rateLimit';
import { assertSameOrigin } from '@/lib/apiHelpers';
import { landingPathForRole } from '@/lib/landing';

export const dynamic = 'force-dynamic';

/**
 * Every failure path clears the session cookie.
 *
 * This is deliberate and load-bearing. Previously the cookie was only ever
 * replaced on SUCCESS, so a failed login left the previous user's session
 * intact — you would see "Invalid email or password" and still be signed in as
 * somebody else. Now the only way to hold a session is to have just presented
 * valid credentials for it.
 */
function fail(message: string, status: number, extraHeaders?: HeadersInit) {
  const res = NextResponse.json({ error: message }, { status, headers: extraHeaders });
  res.cookies.set(SESSION_COOKIE, '', clearedSessionCookie());
  return res;
}

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail('Bad request', 400);
  }

  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return fail('Bad request', 400);
  }

  const ip = clientIp(request);

  const verdict = checkLoginAllowed(email, ip);
  if (verdict.limited) {
    logAudit(null, null, null, 'login_rate_limited', { email, ip });
    return fail(
      'Too many sign-in attempts. Please wait and try again.',
      429,
      { 'Retry-After': String(verdict.retryAfter) }
    );
  }

  const result = await authenticate(email, password);
  if (!result.ok || !result.user) {
    recordLoginFailure(email, ip);
    // Failed attempts were previously not logged at all, leaving no signal to
    // detect credential stuffing against an internet-facing deployment.
    logAudit(null, null, null, 'login_failed', { email, ip });
    return fail('Invalid email or password.', 401);
  }

  const user = result.user;

  // Status gate. A pending or disabled account never receives a token, and is
  // told which of the two it is so the user knows whether to wait or to call
  // the IQAC office.
  if (user.status === 'pending') {
    logAudit(user.id, null, null, 'login_denied_pending', { ip });
    return fail(
      'This account is awaiting approval by the Head of IQAC.',
      403
    );
  }
  if (user.status !== 'active') {
    logAudit(user.id, null, null, 'login_denied_disabled', {
      ip,
      status: user.status,
    });
    return fail(
      'This account has been disabled. Please contact the IQAC office.',
      403
    );
  }

  clearLoginFailures(email, ip);

  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  logAudit(user.id, null, null, 'login', { ip });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    redirectTo: landingPathForRole(),
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE));
  return res;
}
