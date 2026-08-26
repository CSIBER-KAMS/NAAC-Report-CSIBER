/**
 * Capability checks — the one place that answers "may this user do X?".
 *
 * PURE: no database, no node imports. Imported by both server pages and API
 * route handlers so the UI and the enforcement can never disagree — if the
 * sidebar hides a link, the matching endpoint refuses the request for exactly
 * the same reason.
 *
 * Scope rules (criteria, school, ownership) live here too; callers supply the
 * context they know about via `PermCtx`.
 */
import type { Role } from './roles';

export type Action =
  // administration
  | 'admin:access'
  | 'user:list'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:approve'
  | 'user:assign'
  | 'school:manage'
  | 'year:manage'
  | 'year:finalize'
  // AQAR data
  | 'partA:edit'
  | 'metric:edit'
  | 'evidence:upload'
  | 'evidence:delete'
  | 'changeRequest:create'
  | 'changeRequest:resolve'
  // outputs
  | 'generate:draft'
  | 'generate:final'
  | 'export:xlsx';

/** The subject of a permission check, as far as permissions care. */
export interface PermSubject {
  id: number;
  role: Role;
  schoolId: number | null;
  /** Criteria this user may touch. Empty means "all" for unscoped roles. */
  criteria: number[];
}

export interface PermCtx {
  /** Criterion number 0-7 (0 = Extended Profile), derived from the metric id. */
  criterion?: number;
  /** Owner of the row/file being acted on, for "own uploads only" rules. */
  ownerId?: number | null;
  /** School the row/file belongs to, for school-scoped writes. */
  schoolId?: number | null;
}

/** Roles that see and edit every criterion without an assignment list. */
const UNSCOPED: ReadonlySet<Role> = new Set<Role>(['admin', 'iqac_head']);

/** True when the user may act on this criterion at all. */
export function hasCriterion(user: PermSubject, criterion?: number): boolean {
  if (UNSCOPED.has(user.role)) return true;
  if (criterion === undefined) return false;
  return user.criteria.includes(criterion);
}

/**
 * The criteria a scoped user may work on. For admin/head this returns every
 * criterion (0-7) so callers can render a nav without special-casing.
 */
export function assignedCriteria(user: PermSubject): number[] {
  if (UNSCOPED.has(user.role)) return [0, 1, 2, 3, 4, 5, 6, 7];
  return [...user.criteria].sort((a, b) => a - b);
}

/** True when this user's writes must carry (and match) a school id. */
export function isSchoolScoped(user: PermSubject): boolean {
  return user.role === 'school_rep';
}

/**
 * The core check.
 *
 * Read this as the permission matrix; anything not explicitly allowed is
 * denied. Scope-limited answers ("only your criteria", "only your uploads")
 * depend on ctx, so callers MUST pass ctx where the matrix says it matters.
 */
export function can(user: PermSubject, action: Action, ctx: PermCtx = {}): boolean {
  const { role } = user;

  switch (action) {
    /* ---------------- administration ---------------- */
    case 'admin:access':
    case 'user:list':
      return role === 'admin' || role === 'iqac_head';

    case 'user:create':
    case 'user:update':
    case 'user:delete':
      // Provisioning identities is the Admin's job.
      return role === 'admin';

    case 'user:approve':
      // Authorising an account is the Head's job. Admin gets a break-glass
      // path only when no active Head exists — that needs a DB count, so it
      // is decided in session.ts (canApproveAccounts), not here.
      return role === 'iqac_head';

    case 'user:assign':
      // Deciding which criteria a coordinator may reach.
      return role === 'admin' || role === 'iqac_head';

    case 'school:manage':
    case 'year:manage':
    case 'year:finalize':
      return role === 'admin' || role === 'iqac_head';

    /* ---------------- AQAR data ---------------- */
    case 'partA:edit':
      // Part A is institution-level data, not criterion work.
      return role === 'admin' || role === 'iqac_head';

    case 'metric:edit':
    case 'evidence:upload':
      if (UNSCOPED.has(role)) return true;
      if (role === 'coordinator' || role === 'school_rep') {
        return hasCriterion(user, ctx.criterion);
      }
      return false;

    case 'evidence:delete':
      if (UNSCOPED.has(role)) return true;
      if (role === 'coordinator') return hasCriterion(user, ctx.criterion);
      if (role === 'school_rep') {
        // Reps may remove only what they uploaded themselves.
        return (
          hasCriterion(user, ctx.criterion) &&
          ctx.ownerId != null &&
          ctx.ownerId === user.id
        );
      }
      return false;

    case 'changeRequest:create':
      // Anyone signed in may raise a correction — that is the review loop.
      return true;

    case 'changeRequest:resolve':
      if (UNSCOPED.has(role)) return true;
      // Coordinators close requests on their own criteria; reps may not close
      // feedback (including their own).
      if (role === 'coordinator') return hasCriterion(user, ctx.criterion);
      return false;

    /* ---------------- outputs ---------------- */
    case 'generate:draft':
      return role === 'admin' || role === 'iqac_head' || role === 'coordinator';

    case 'generate:final':
      // The FINAL document is the artefact submitted to NAAC.
      return role === 'admin' || role === 'iqac_head';

    case 'export:xlsx':
      return role === 'admin' || role === 'iqac_head' || role === 'coordinator';

    default: {
      // Exhaustiveness: adding an Action without handling it fails the build.
      const never: never = action;
      return never;
    }
  }
}

/**
 * Whether a school-scoped user may write this particular row/file.
 * Callers combine this with `can(...)`; it is separate because the school
 * check applies to the ROW being written, not to the action in the abstract.
 */
export function canTouchSchoolRow(
  user: PermSubject,
  rowSchoolId: number | null | undefined
): boolean {
  if (!isSchoolScoped(user)) return true;
  if (user.schoolId == null) return false;
  // A rep owns rows tagged with their school. Untagged legacy rows (null) are
  // treated as not theirs, so they can never silently overwrite shared data.
  return rowSchoolId === user.schoolId;
}
