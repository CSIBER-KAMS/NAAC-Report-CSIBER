/**
 * Roles, statuses and their presentation — the single source of truth.
 *
 * This module is deliberately CLIENT-SAFE: no node imports, no database, no
 * server-only APIs. `admin-client.tsx` is a client component and imports from
 * here, so anything added below must stay serialisable and dependency-free.
 *
 * Adding a role means: add it to ROLES, fill in every Record below (TypeScript
 * will tell you which ones), decide NEEDS_APPROVAL, add its permissions in
 * permissions.ts — and write a NEW migration. Never edit an old migration.
 */

/** Ordered most-privileged first; used for display ordering too. */
export const ROLES = ['admin', 'iqac_head', 'coordinator', 'school_rep'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['pending', 'active', 'rejected', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Human label for a role, shown in tables, chips and selects. */
export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  iqac_head: 'Head of IQAC',
  coordinator: 'Criterion Coordinator',
  school_rep: 'School Representative',
};

/** The portal name shown at the top of the sidebar — answers "what access do I have?". */
export const ROLE_PORTAL: Record<Role, string> = {
  admin: 'Administration Portal',
  iqac_head: 'Head of IQAC Portal',
  coordinator: 'Criterion Coordinator Portal',
  school_rep: 'School Representative Portal',
};

/** One-line description of what the role can do, shown on the dashboard. */
export const ROLE_SUMMARY: Record<Role, string> = {
  admin:
    'Full system access. Manages user accounts, schools and academic years.',
  iqac_head:
    'Full AQAR access. Approves new accounts, assigns criteria, and finalises the year.',
  coordinator:
    'Edits the criteria assigned to you and generates draft reports.',
  school_rep:
    'Contributes data and evidence for your school.',
};

/** Visual accent so the four portals are distinguishable at a glance. */
export const ROLE_THEME: Record<
  Role,
  { tone: 'blue' | 'green' | 'amber' | 'slate'; bar: string; chip: string }
> = {
  admin: {
    tone: 'blue',
    bar: 'bg-brand-700',
    chip: 'bg-brand-100 text-brand-800',
  },
  iqac_head: {
    tone: 'green',
    bar: 'bg-emerald-700',
    chip: 'bg-emerald-100 text-emerald-800',
  },
  coordinator: {
    tone: 'amber',
    bar: 'bg-amber-600',
    chip: 'bg-amber-100 text-amber-900',
  },
  school_rep: {
    tone: 'slate',
    bar: 'bg-slate-600',
    chip: 'bg-slate-200 text-slate-800',
  },
};

/**
 * Roles whose accounts are created in `pending` and must be approved by the
 * Head of IQAC before they can sign in. Admin and iqac_head are created active
 * because there is no higher authority to approve them (see canApproveAccounts
 * in session.ts for the break-glass rule).
 */
export const NEEDS_APPROVAL: ReadonlySet<Role> = new Set<Role>([
  'coordinator',
  'school_rep',
]);

/** Roles that are scoped to a subset of criteria rather than seeing all of them. */
export const CRITERION_SCOPED: ReadonlySet<Role> = new Set<Role>([
  'coordinator',
  'school_rep',
]);

/** Roles that must be attached to a school. */
export const SCHOOL_SCOPED: ReadonlySet<Role> = new Set<Role>(['school_rep']);

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v);
}

export function isUserStatus(v: unknown): v is UserStatus {
  return (
    typeof v === 'string' && (USER_STATUSES as readonly string[]).includes(v)
  );
}

/** Label for a criterion number, where 0 is the Extended Profile. */
export function criterionLabel(n: number): string {
  return n === 0 ? 'Extended Profile' : `Criterion ${n}`;
}
