import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser, type AuthUser } from './session';
import { can, type Action, type PermCtx } from './permissions';
import { getYearByLabel, type YearRow } from './db';
import { getMetric } from '@/catalog/index';

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Resolve ?year=<label> to a year row, or null (route should respond 404). */
export function resolveYear(label: string | null): YearRow | null {
  if (!label) return null;
  return getYearByLabel(label) ?? null;
}

/** True when the year still accepts writes. */
export function yearWritable(year: YearRow): boolean {
  return year.status !== 'final';
}

/**
 * The criterion a metric belongs to (0 = Extended Profile), for scope checks.
 * Returns undefined for an unknown metric id.
 */
export function criterionOf(metricId: string | null | undefined): number | undefined {
  if (!metricId) return undefined;
  return getMetric(metricId)?.criterion.number;
}

/**
 * Reject cross-site mutations.
 *
 * SameSite=Lax already blocks most of this, but multipart form posts (evidence
 * upload) are a CORS "simple request" that a cross-site HTML form can issue
 * without a preflight. Checking Origin covers every mutating route in one
 * place rather than per-handler tokens.
 */
export function assertSameOrigin(request: NextRequest): NextResponse | null {
  if (request.method === 'GET' || request.method === 'HEAD') return null;

  const origin = request.headers.get('origin');
  // Same-origin fetches from some clients omit Origin entirely; a cross-site
  // form post always sends it, so absence is not the risk case.
  if (!origin) return null;

  const allowed = new Set<string>();
  if (process.env.APP_ORIGIN) allowed.add(process.env.APP_ORIGIN);
  allowed.add(request.nextUrl.origin);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (process.env.TRUSTED_PROXY === '1' && forwardedHost) {
    allowed.add(`${forwardedProto}://${forwardedHost}`);
  }

  if (!allowed.has(origin)) {
    return jsonError('Cross-origin request rejected.', 403);
  }
  return null;
}

type Guarded =
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Authenticate. Resolves the user from the DB (not the token), and enforces
 * the same-origin check on any mutating method.
 */
export async function requireAuth(request: NextRequest): Promise<Guarded> {
  const originError = assertSameOrigin(request);
  if (originError) return { user: null, error: originError };

  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: jsonError('Not authenticated', 401) };
  }
  return { user, error: null };
}

/**
 * Authenticate and authorize in one step.
 *
 * Uses the same `can()` the UI uses, so an endpoint can never permit something
 * the interface hides, or refuse something it offers.
 */
export async function requireCan(
  request: NextRequest,
  action: Action,
  ctx: PermCtx = {}
): Promise<Guarded> {
  const auth = await requireAuth(request);
  if (auth.error) return auth;

  if (!can(auth.user, action, ctx)) {
    return {
      user: null,
      error: jsonError(
        'You do not have permission to perform this action.',
        403
      ),
    };
  }
  return auth;
}
