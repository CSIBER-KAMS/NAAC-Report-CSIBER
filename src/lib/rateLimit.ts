/**
 * In-process login throttling.
 *
 * An in-memory Map is the right tool here specifically BECAUSE this system is
 * deployed as exactly one always-on Node process with one replica (SQLite with
 * WAL cannot be shared by concurrent writers, so horizontal scaling is already
 * off the table). If that ever changes, this becomes per-instance and much
 * weaker — see docs/RUNBOOK.md.
 */

interface Bucket {
  count: number;
  firstAt: number;
  lockedUntil: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
const SWEEP_EVERY_MS = 5 * 60 * 1000;

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, b] of Array.from(buckets.entries())) {
    if (b.lockedUntil < now && now - b.firstAt > WINDOW_MS) buckets.delete(key);
  }
}

export interface RateLimitVerdict {
  limited: boolean;
  /** Seconds until the caller may try again; 0 when not limited. */
  retryAfter: number;
}

function check(key: string, max: number, now: number): RateLimitVerdict {
  const b = buckets.get(key);
  if (!b) return { limited: false, retryAfter: 0 };
  if (b.lockedUntil > now) {
    return { limited: true, retryAfter: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  if (now - b.firstAt > WINDOW_MS) {
    buckets.delete(key);
    return { limited: false, retryAfter: 0 };
  }
  if (b.count >= max) {
    b.lockedUntil = now + LOCK_MS;
    return { limited: true, retryAfter: Math.ceil(LOCK_MS / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

/** Called BEFORE verifying credentials. */
export function checkLoginAllowed(
  email: string,
  ip: string
): RateLimitVerdict {
  const now = Date.now();
  sweep(now);
  const byEmail = check(`e:${email.trim().toLowerCase()}`, MAX_PER_EMAIL, now);
  if (byEmail.limited) return byEmail;
  return check(`i:${ip}`, MAX_PER_IP, now);
}

/** Called after a failed attempt. */
export function recordLoginFailure(email: string, ip: string): void {
  const now = Date.now();
  for (const key of [`e:${email.trim().toLowerCase()}`, `i:${ip}`]) {
    const b = buckets.get(key);
    if (!b || now - b.firstAt > WINDOW_MS) {
      buckets.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    } else {
      b.count += 1;
    }
  }
}

/** Called after a successful login, so one good login clears the slate. */
export function clearLoginFailures(email: string, ip: string): void {
  buckets.delete(`e:${email.trim().toLowerCase()}`);
  buckets.delete(`i:${ip}`);
}

/**
 * Client IP.
 *
 * x-forwarded-for is attacker-controlled unless a reverse proxy we run is
 * definitely setting it, so it is only trusted when TRUSTED_PROXY=1. Otherwise
 * a per-IP limit would be trivially bypassed by spoofing the header.
 */
export function clientIp(request: Request): string {
  if (process.env.TRUSTED_PROXY === '1') {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
      const first = xff.split(',')[0]?.trim();
      if (first) return first;
    }
    const real = request.headers.get('x-real-ip');
    if (real) return real.trim();
  }
  return 'unknown';
}

/** Test-only: reset all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
  lastSweep = 0;
}
