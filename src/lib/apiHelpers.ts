import { NextResponse } from 'next/server';
import { currentUser, type SessionUser } from './auth';
import { getYearByLabel, type YearRow } from './db';

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Returns the session user, or null (route should respond 401). */
export async function requireUser(): Promise<SessionUser | null> {
  return currentUser();
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
