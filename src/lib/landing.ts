/**
 * Where a user should land after signing in.
 *
 * Every role starts at "/", which resolves to the most recent academic year's
 * dashboard, or explains what to do when no year exists yet. Keeping this in
 * one place means the login route and the root page can never disagree about
 * the entry point.
 */
export function landingPathForRole(): string {
  return '/';
}
