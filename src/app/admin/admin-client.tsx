'use client';

/**
 * The administration console.
 *
 * Two roles share this screen and see different halves of it:
 *
 *   Administrator — provisions accounts, resets passwords, manages schools and
 *                   academic years.
 *   Head of IQAC  — approves the accounts the Administrator created, and
 *                   decides which criteria each contributor owns.
 *
 * Nothing here is gated on a hardcoded role string: every control asks
 * `can(viewer, ...)`, the same function the matching API route asks. If a
 * button is visible the request will be accepted, and if it is hidden the
 * request would have been refused anyway.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CRITERION_SCOPED,
  NEEDS_APPROVAL,
  ROLES,
  ROLE_LABEL,
  SCHOOL_SCOPED,
  criterionLabel,
  type Role,
  type UserStatus,
} from '@/lib/roles';
import { can, type PermSubject } from '@/lib/permissions';
import { Badge, EmptyState, PageHeader } from '@/components/ui';

/* ------------------------------------------------------------------ types */

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  school_id: number | null;
  school_name: string | null;
  created_at: string;
}

export interface AdminYear {
  id: number;
  label: string;
  status: 'draft' | 'final';
  created_at: string;
  /**
   * Readiness of the year's data, from computeReadiness — the same verdict the
   * Generate page shows. Finalising a year that is NOT ready is a trap: the
   * data locks read-only, so the blockers can no longer be fixed, and the
   * FINAL document cannot be generated until they are. Always true for a year
   * that is already final, where the question no longer applies.
   */
  ready: boolean;
  /** Why it is not ready, as one phrase. Empty when ready. */
  blockedReason: string;
}

export interface AdminSchool {
  id: number;
  name: string;
  code: string | null;
  /** SQLite boolean: 1 = selectable when attaching a representative. */
  active: number;
  created_at: string;
  /** Pending or active representatives — what blocks deactivation/deletion. */
  rep_count: number;
}

/** One row of `user_criteria`, exactly as stored. */
export interface UserCriterionRow {
  user_id: number;
  criterion: number;
}

export interface AdminClientProps {
  users: AdminUser[];
  years: AdminYear[];
  schools: AdminSchool[];
  assignments: UserCriterionRow[];
  currentUserId: number;
  currentUserRole: Role;
  /** From canApproveAccounts() — the Head, or an Admin when no Head is active. */
  canApprove: boolean;
}

/** 0 is the Extended Profile; 1-7 are the NAAC criteria. */
const ALL_CRITERIA = [0, 1, 2, 3, 4, 5, 6, 7];

/** Columns in the users table, for the full-width scope editor row. */
const USER_COLSPAN = 7;

/* ---------------------------------------------------------------- helpers */

/**
 * Fire a mutating request and return the server's message, or null on success.
 *
 * Every caller renders the returned string next to the control that produced
 * it. The API's wording is deliberately kept as-is: it explains guard rails
 * ("Cannot demote the last active Administrator", "This school still has a
 * School Representative") that the UI has no business paraphrasing.
 */
async function mutate(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: unknown };
    if (!res.ok) {
      return typeof data.error === 'string' && data.error.trim() !== ''
        ? data.error
        : `Request failed (${res.status})`;
    }
    return null;
  } catch {
    return 'Could not reach the server — nothing was saved.';
  }
}

/** 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DD'. Deterministic: no locale, no hydration drift. */
function shortDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '—';
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ErrorText({
  message,
  className = '',
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p role="alert" className={`text-sm text-red-600 ${className}`}>
      {message}
    </p>
  );
}

function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-5 py-2 font-medium ${className}`}>{children}</th>
  );
}

const STATUS_TONE: Record<UserStatus, 'green' | 'amber' | 'red' | 'slate'> = {
  active: 'green',
  pending: 'amber',
  rejected: 'red',
  disabled: 'slate',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  pending: 'Awaiting approval',
  rejected: 'Rejected',
  disabled: 'Disabled',
};

function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** Short, readable summary of a criterion assignment. */
function scopeSummary(criteria: number[]): string {
  if (criteria.length === 0) return 'No criteria assigned';
  if (criteria.length === ALL_CRITERIA.length) return 'All criteria';
  return criteria.map(criterionLabel).join(', ');
}

/* ------------------------------------------------------------------- root */

export default function AdminClient({
  users,
  years,
  schools,
  assignments,
  currentUserId,
  currentUserRole,
  canApprove,
}: AdminClientProps) {
  const router = useRouter();
  const refresh = () => router.refresh();

  // The viewer as the permission layer sees them. schoolId/criteria are
  // irrelevant to every admin-side action, which is why they can be blank.
  const viewer: PermSubject = useMemo(
    () => ({
      id: currentUserId,
      role: currentUserRole,
      schoolId: null,
      criteria: [],
    }),
    [currentUserId, currentUserRole]
  );

  const criteriaByUser = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const row of assignments) {
      const list = map.get(row.user_id);
      if (list) list.push(row.criterion);
      else map.set(row.user_id, [row.criterion]);
    }
    map.forEach((list) => list.sort((a, b) => a - b));
    return map;
  }, [assignments]);

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Administration"
        subtitle="Accounts, criterion assignments, schools and academic years."
        actions={
          <>
            {canApprove && pendingCount > 0 && (
              <Badge tone="amber">
                {pendingCount} awaiting approval
              </Badge>
            )}
            <Badge tone="blue">{ROLE_LABEL[currentUserRole]}</Badge>
          </>
        }
      />

      {canApprove && (
        <ApprovalsSection
          users={users}
          currentUserId={currentUserId}
          onDone={refresh}
        />
      )}

      {can(viewer, 'user:list') && (
        <UsersSection
          users={users}
          schools={schools}
          criteriaByUser={criteriaByUser}
          viewer={viewer}
          currentUserId={currentUserId}
          onDone={refresh}
        />
      )}

      {can(viewer, 'school:manage') && (
        <SchoolsSection schools={schools} onDone={refresh} />
      )}

      {can(viewer, 'year:manage') && (
        <YearsSection years={years} onDone={refresh} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- approvals */

function ApprovalsSection({
  users,
  currentUserId,
  onDone,
}: {
  users: AdminUser[];
  currentUserId: number;
  onDone: () => void;
}) {
  const pending = users.filter((u) => u.status === 'pending');

  return (
    <Section
      title="Account approvals"
      description="A new Criterion Coordinator or School Representative cannot sign in until you approve them here. Rejecting an account records the reason and ends any session it holds."
    >
      {pending.length === 0 ? (
        <EmptyState>No accounts are waiting for approval.</EmptyState>
      ) : (
        <div className="card p-0 ring-1 ring-amber-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>School</Th>
                  <Th>Requested</Th>
                  <Th className="text-right">Decision</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((u) => (
                  <ApprovalRow
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUserId}
                    onDone={onDone}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
}

function ApprovalRow({
  user,
  isSelf,
  onDone,
}: {
  user: AdminUser;
  isSelf: boolean;
  onDone: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approve' | 'reject') {
    setBusy(decision);
    setError(null);
    const trimmed = note.trim();
    const message = await mutate(`/api/admin/users/${user.id}/approval`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        ...(trimmed === '' ? {} : { note: trimmed }),
      }),
    });
    setBusy(null);
    if (message) {
      setError(message);
      return;
    }
    setNote('');
    onDone();
  }

  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
        {user.name}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {user.email}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {ROLE_LABEL[user.role]}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {user.school_name ?? '—'}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
        {shortDate(user.created_at)}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-end gap-2">
          <input
            className="input w-64 py-1 text-xs"
            placeholder="Note (optional — recorded with the decision)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy !== null}
          />
          <span className="inline-flex gap-2">
            <button
              type="button"
              className="btn-primary px-3 py-1 text-xs"
              onClick={() => void decide('approve')}
              disabled={busy !== null || isSelf}
              title={isSelf ? 'You cannot approve your own account.' : undefined}
            >
              {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              className="btn-danger px-3 py-1 text-xs"
              onClick={() => void decide('reject')}
              disabled={busy !== null || isSelf}
              title={isSelf ? 'You cannot reject your own account.' : undefined}
            >
              {busy === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </span>
          <ErrorText message={error} className="text-right" />
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ users */

function UsersSection({
  users,
  schools,
  criteriaByUser,
  viewer,
  currentUserId,
  onDone,
}: {
  users: AdminUser[];
  schools: AdminSchool[];
  criteriaByUser: Map<number, number[]>;
  viewer: PermSubject;
  currentUserId: number;
  onDone: () => void;
}) {
  const canCreate = can(viewer, 'user:create');
  const canUpdate = can(viewer, 'user:update');
  const canDelete = can(viewer, 'user:delete');
  const canAssign = can(viewer, 'user:assign');

  return (
    <Section
      title="Users"
      description={
        canCreate
          ? 'Creating an account is the Administrator’s job; deciding which criteria it may reach is the Head of IQAC’s.'
          : 'Accounts are created by the Administrator. Assigning criteria and schools is your decision as Head of IQAC.'
      }
    >
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>School</Th>
                <Th>Scope</Th>
                <Th className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  schools={schools}
                  criteria={criteriaByUser.get(u.id) ?? []}
                  isSelf={u.id === currentUserId}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  canAssign={canAssign}
                  onDone={onDone}
                />
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={USER_COLSPAN}
                    className="px-5 py-6 text-center text-sm text-slate-500"
                  >
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canCreate && <CreateUserForm schools={schools} onDone={onDone} />}
      </div>
    </Section>
  );
}

function UserRow({
  user,
  schools,
  criteria,
  isSelf,
  canUpdate,
  canDelete,
  canAssign,
  onDone,
}: {
  user: AdminUser;
  schools: AdminSchool[];
  criteria: number[];
  isSelf: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingScope, setEditingScope] = useState(false);

  const scoped =
    CRITERION_SCOPED.has(user.role) || SCHOOL_SCOPED.has(user.role);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    onDone();
  }

  function changeRole(role: Role) {
    if (role === user.role) return;
    void run(() =>
      mutate(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
    );
  }

  function resetPassword() {
    const password = window.prompt(`New password for ${user.email}:`, '');
    if (password === null) return;
    void run(async () => {
      const message = await mutate(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
      if (!message) {
        window.alert(
          `Password updated for ${user.email}. Their existing sessions have been signed out.`
        );
      }
      return message;
    });
  }

  function deleteUser() {
    if (
      !window.confirm(
        `Delete ${user.name} <${user.email}>? Their uploads and audit history are kept, but their criterion assignments are removed.`
      )
    ) {
      return;
    }
    void run(() =>
      mutate(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    );
  }

  return (
    <>
      <tr className="align-top">
        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
          {user.name}
          {isSelf && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              (you)
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
          {user.email}
        </td>
        <td className="whitespace-nowrap px-5 py-3">
          {canUpdate ? (
            <select
              className="input w-auto py-1 text-xs"
              value={user.role}
              onChange={(e) => changeRole(e.target.value as Role)}
              disabled={busy}
              aria-label={`Role for ${user.name}`}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-600">{ROLE_LABEL[user.role]}</span>
          )}
        </td>
        <td className="whitespace-nowrap px-5 py-3">
          <UserStatusBadge status={user.status} />
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
          {user.school_name ?? '—'}
        </td>
        <td className="px-5 py-3">
          {!scoped ? (
            <span className="text-xs text-slate-400">
              Every criterion
            </span>
          ) : (
            <div className="max-w-56">
              <div className="text-xs text-slate-600">
                {scopeSummary(criteria)}
              </div>
              {canAssign && (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-brand-700 underline hover:text-brand-800"
                  onClick={() => setEditingScope((v) => !v)}
                >
                  {editingScope ? 'Close' : 'Edit assignment'}
                </button>
              )}
            </div>
          )}
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-right">
          <span className="inline-flex gap-2">
            {canUpdate && (
              <button
                type="button"
                className="btn-secondary px-3 py-1 text-xs"
                onClick={resetPassword}
                disabled={busy}
              >
                Reset password
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn-danger px-3 py-1 text-xs"
                onClick={deleteUser}
                disabled={busy || isSelf}
                title={
                  isSelf ? 'You cannot delete your own account.' : undefined
                }
              >
                Delete
              </button>
            )}
          </span>
          <ErrorText message={error} className="mt-2 text-right" />
        </td>
      </tr>

      {editingScope && canAssign && scoped && (
        <tr className="bg-slate-50">
          <td colSpan={USER_COLSPAN} className="px-5 py-4">
            <ScopeEditor
              user={user}
              schools={schools}
              criteria={criteria}
              onCancel={() => setEditingScope(false)}
              onSaved={() => {
                setEditingScope(false);
                onDone();
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * The Head of IQAC's assignment control: which criteria this account owns, and
 * (for a School Representative) which school it speaks for.
 */
function ScopeEditor({
  user,
  schools,
  criteria,
  onSaved,
  onCancel,
}: {
  user: AdminUser;
  schools: AdminSchool[];
  criteria: number[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<number[]>(criteria);
  const [schoolId, setSchoolId] = useState<number | null>(user.school_id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSchool = SCHOOL_SCOPED.has(user.role);
  const takesCriteria = CRITERION_SCOPED.has(user.role);

  // Only active schools can be attached. The account's current school is kept
  // in the list even if it has since been deactivated, so the select never
  // silently misreports where this representative belongs.
  const options = schools.filter(
    (s) => s.active === 1 || s.id === user.school_id
  );

  function toggle(n: number) {
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((c) => c !== n) : [...prev, n].sort((a, b) => a - b)
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    const body: { criteria?: number[]; schoolId?: number | null } = {};
    if (takesCriteria) body.criteria = [...selected].sort((a, b) => a - b);
    if (needsSchool) body.schoolId = schoolId;

    const message = await mutate(`/api/admin/users/${user.id}/scope`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Criterion assignment for{' '}
        <span className="font-medium text-slate-700">{user.name}</span> — the
        Head of IQAC decides what this account may open and edit.
      </p>

      {takesCriteria && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Criteria
            </span>
            <button
              type="button"
              className="text-xs font-medium text-brand-700 underline hover:text-brand-800"
              onClick={() => setSelected([...ALL_CRITERIA])}
              disabled={busy}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs font-medium text-brand-700 underline hover:text-brand-800"
              onClick={() => setSelected([])}
              disabled={busy}
            >
              None
            </button>
          </div>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_CRITERIA.map((n) => (
              <label
                key={n}
                className="flex items-center gap-2 text-xs text-slate-700"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                  checked={selected.includes(n)}
                  onChange={() => toggle(n)}
                  disabled={busy}
                />
                {criterionLabel(n)}
              </label>
            ))}
          </div>
        </div>
      )}

      {needsSchool && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            School
          </label>
          <select
            className="input w-auto py-1 text-xs"
            value={schoolId ?? ''}
            onChange={(e) =>
              setSchoolId(e.target.value === '' ? null : Number(e.target.value))
            }
            disabled={busy}
          >
            <option value="">— select a school —</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.code ? ` (${s.code})` : ''}
                {s.active === 1 ? '' : ' — inactive'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-primary px-3 py-1 text-xs"
          onClick={() => void save()}
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save assignment'}
        </button>
        <button
          type="button"
          className="btn-secondary px-3 py-1 text-xs"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>

      <ErrorText message={error} />
    </div>
  );
}

function CreateUserForm({
  schools,
  onDone,
}: {
  schools: AdminSchool[];
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('coordinator');
  const [schoolId, setSchoolId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSchools = schools.filter((s) => s.active === 1);
  const needsSchool = SCHOOL_SCOPED.has(role);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // The password rule (length and character classes) lives in the API; we
    // send what was typed and show whatever it says back, so the two can never
    // drift apart.
    const message = await mutate('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        ...(needsSchool && schoolId !== '' ? { schoolId: Number(schoolId) } : {}),
      }),
    });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    setRole('coordinator');
    setSchoolId('');
    onDone();
  }

  return (
    <div className="border-t border-slate-200">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3 px-5 py-4">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Name
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="min-w-52 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Password
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Role
          </label>
          <select
            className="input w-auto"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={busy}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        {needsSchool && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              School
            </label>
            <select
              className="input w-auto"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              required
              disabled={busy}
            >
              <option value="">— select —</option>
              {activeSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.code ? ` (${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Adding…' : 'Add user'}
        </button>
      </form>

      <p className="px-5 pb-4 text-xs text-slate-500">
        {NEEDS_APPROVAL.has(role)
          ? `A ${ROLE_LABEL[role]} account starts as “awaiting approval” and cannot sign in until the Head of IQAC approves it.`
          : `A ${ROLE_LABEL[role]} account is active immediately — there is no higher authority to approve it.`}
      </p>

      <ErrorText message={error} className="border-t border-slate-100 px-5 py-3" />
    </div>
  );
}

/* ---------------------------------------------------------------- schools */

function SchoolsSection({
  schools,
  onDone,
}: {
  schools: AdminSchool[];
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addSchool(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await mutate('/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...(code.trim() === '' ? {} : { code: code.trim() }),
      }),
    });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    setName('');
    setCode('');
    onDone();
  }

  return (
    <Section
      title="Schools"
      description="Each School Representative speaks for exactly one school. A school with a representative attached cannot be deactivated or deleted."
    >
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Representatives</Th>
                <Th className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s) => (
                <SchoolRow key={s.id} school={s} onDone={onDone} />
              ))}
              {schools.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-sm text-slate-500"
                  >
                    No schools yet. Add the first one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={addSchool}
          className="flex flex-wrap items-end gap-3 border-t border-slate-200 px-5 py-4"
        >
          <div className="min-w-52 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              New school name
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Code (optional)
            </label>
            <input
              className="input w-32"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Adding…' : 'Add school'}
          </button>
        </form>

        <ErrorText
          message={error}
          className="border-t border-slate-100 px-5 py-3"
        />
      </div>
    </Section>
  );
}

function SchoolRow({
  school,
  onDone,
}: {
  school: AdminSchool;
  onDone: () => void;
}) {
  const [name, setName] = useState(school.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renamed = name.trim() !== '' && name.trim() !== school.name;

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) {
      setError(message);
      return false;
    }
    onDone();
    return true;
  }

  function rename() {
    void run(() =>
      mutate(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      })
    );
  }

  function toggleActive() {
    void run(() =>
      mutate(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: school.active === 1 ? false : true }),
      })
    );
  }

  function remove() {
    if (
      !window.confirm(
        `Delete ${school.name}? This is only possible while nothing references it.`
      )
    ) {
      return;
    }
    void run(async () => {
      const message = await mutate(`/api/admin/schools/${school.id}`, {
        method: 'DELETE',
      });
      // A 409 here is the API explaining what to do instead (mark it
      // inactive); it is shown in the row rather than swallowed.
      return message;
    });
  }

  return (
    <tr className="align-top">
      <td className="px-5 py-3">
        <input
          className="input w-56 py-1 text-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          aria-label={`Name of ${school.name}`}
        />
        <ErrorText message={error} className="mt-2" />
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {school.code ?? '—'}
      </td>
      <td className="whitespace-nowrap px-5 py-3">
        {school.active === 1 ? (
          <Badge tone="green">Active</Badge>
        ) : (
          <Badge tone="slate">Inactive</Badge>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {school.rep_count}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right">
        <span className="inline-flex gap-2">
          {renamed && (
            <button
              type="button"
              className="btn-primary px-3 py-1 text-xs"
              onClick={rename}
              disabled={busy}
            >
              Save name
            </button>
          )}
          <button
            type="button"
            className="btn-secondary px-3 py-1 text-xs"
            onClick={toggleActive}
            disabled={busy}
          >
            {school.active === 1 ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="btn-danger px-3 py-1 text-xs"
            onClick={remove}
            disabled={busy}
          >
            Delete
          </button>
        </span>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ years */

function YearsSection({
  years,
  onDone,
}: {
  years: AdminYear[];
  onDone: () => void;
}) {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    onDone();
  }

  function addYear(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      const message = await mutate('/api/admin/years', {
        method: 'POST',
        body: JSON.stringify({ label }),
      });
      if (!message) setLabel('');
      return message;
    });
  }

  function setYearStatus(year: AdminYear, status: 'final' | 'draft') {
    // Finalising an unready year cannot be undone from inside the year: the
    // data goes read-only, so the blockers can no longer be fixed, and the
    // FINAL document stays refused until they are. Say that plainly before
    // asking, rather than letting it be discovered afterwards.
    const question =
      status !== 'final'
        ? `Reopen ${year.label} for editing?`
        : year.ready
          ? `Mark ${year.label} as FINAL? All data becomes read-only and generated documents lose the draft stamp.`
          : `Mark ${year.label} as FINAL?\n\nThis year is NOT ready: ${year.blockedReason}.\n\nAll data becomes read-only, so these can no longer be corrected, and the FINAL document cannot be generated until they are — the only way back is to reopen the year.\n\nFinalise anyway?`;
    if (!window.confirm(question)) return;
    void run(() =>
      mutate(`/api/admin/years/${year.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(status === 'final' && !year.ready
            ? { acknowledgeNotReady: true }
            : {}),
        }),
      })
    );
  }

  return (
    <Section
      title="Academic years"
      description="Marking a year final locks it against every further write."
    >
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <Th>Year</Th>
                <Th>Status</Th>
                <Th>Readiness</Th>
                <Th className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {years.map((y) => (
                <tr key={y.id}>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                    {y.label}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {y.status === 'final' ? (
                      <Badge tone="green">Final</Badge>
                    ) : (
                      <Badge tone="slate">Draft</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {y.status === 'final' ? (
                      <span className="text-slate-400">—</span>
                    ) : y.ready ? (
                      <Badge tone="green">Ready to finalise</Badge>
                    ) : (
                      <span className="text-xs text-amber-800">
                        Not ready — {y.blockedReason}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    {y.status === 'final' ? (
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1 text-xs"
                        onClick={() => setYearStatus(y, 'draft')}
                        disabled={busy}
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary px-3 py-1 text-xs"
                        onClick={() => setYearStatus(y, 'final')}
                        disabled={busy}
                      >
                        Mark final
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {years.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-sm text-slate-500"
                  >
                    No academic years yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={addYear}
          className="flex flex-wrap items-end gap-3 border-t border-slate-200 px-5 py-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              New year label (e.g. 2026-27)
            </label>
            <input
              className="input w-40"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              pattern="\d{4}-\d{2}"
              placeholder="2026-27"
              required
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Adding…' : 'Add year'}
          </button>
        </form>

        <ErrorText
          message={error}
          className="border-t border-slate-100 px-5 py-3"
        />
      </div>
    </Section>
  );
}
