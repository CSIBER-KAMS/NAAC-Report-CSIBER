'use client';

import { useState } from 'react';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface AdminYear {
  id: number;
  label: string;
  status: 'draft' | 'final';
  created_at: string;
}

async function apiCall(
  url: string,
  init?: RequestInit
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    ...init,
    headers:
      init?.body !== undefined
        ? { 'Content-Type': 'application/json', ...init?.headers }
        : init?.headers,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Request failed (${res.status})`
    );
  }
  return data;
}

export default function AdminClient({
  initialUsers,
  initialYears,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  initialYears: AdminYear[];
  currentUserId: number;
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [years, setYears] = useState<AdminYear[]>(initialYears);

  const [userError, setUserError] = useState<string | null>(null);
  const [yearError, setYearError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // new-user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');

  // new-year form
  const [newLabel, setNewLabel] = useState('');

  async function refreshUsers() {
    const data = await apiCall('/api/admin/users');
    setUsers((data.users as AdminUser[]) ?? []);
  }

  async function refreshYears() {
    const data = await apiCall('/api/admin/years');
    setYears((data.years as AdminYear[]) ?? []);
  }

  async function runUserAction(fn: () => Promise<void>) {
    setBusy(true);
    setUserError(null);
    try {
      await fn();
      await refreshUsers();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function runYearAction(fn: () => Promise<void>) {
    setBusy(true);
    setYearError(null);
    try {
      await fn();
      await refreshYears();
    } catch (err) {
      setYearError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  function addUser(e: React.FormEvent) {
    e.preventDefault();
    void runUserAction(async () => {
      await apiCall('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
    });
  }

  function resetPassword(u: AdminUser) {
    const password = window.prompt(
      `New password for ${u.name} (min 6 characters):`,
      ''
    );
    if (password === null) return;
    void runUserAction(async () => {
      await apiCall(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
      window.alert(`Password updated for ${u.email}.`);
    });
  }

  function changeRole(u: AdminUser, role: 'admin' | 'staff') {
    if (role === u.role) return;
    void runUserAction(async () => {
      await apiCall(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    });
  }

  function deleteUser(u: AdminUser) {
    if (
      !window.confirm(
        `Delete user ${u.name} <${u.email}>? Their past uploads and audit history are kept.`
      )
    ) {
      return;
    }
    void runUserAction(async () => {
      await apiCall(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    });
  }

  function addYear(e: React.FormEvent) {
    e.preventDefault();
    void runYearAction(async () => {
      await apiCall('/api/admin/years', {
        method: 'POST',
        body: JSON.stringify({ label: newLabel }),
      });
      setNewLabel('');
    });
  }

  function setYearStatus(y: AdminYear, status: 'final' | 'draft') {
    const message =
      status === 'final'
        ? `Mark ${y.label} as FINAL? All data becomes read-only and generated documents lose the draft stamp.`
        : `Reopen ${y.label} for editing?`;
    if (!window.confirm(message)) return;
    void runYearAction(async () => {
      await apiCall(`/api/admin/years/${y.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-900">Users</h1>
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Role</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {u.email}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={u.role}
                        onChange={(e) =>
                          changeRole(u, e.target.value as 'admin' | 'staff')
                        }
                        disabled={busy}
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <span className="inline-flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1 text-xs"
                          onClick={() => resetPassword(u)}
                          disabled={busy}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="btn-danger px-3 py-1 text-xs"
                          onClick={() => deleteUser(u)}
                          disabled={busy || u.id === currentUserId}
                        >
                          Delete
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form
            onSubmit={addUser}
            className="flex flex-wrap items-end gap-3 border-t border-slate-200 px-5 py-4"
          >
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
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
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
                disabled={busy}
              >
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              Add user
            </button>
          </form>
          {userError && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-red-600">
              {userError}
            </p>
          )}
        </div>
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-900">
          Academic years
        </h1>
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2 font-medium">Year</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium" />
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
                        <span className="badge bg-green-100 text-green-800">
                          Final
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-700">
                          Draft
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
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                pattern="\d{4}-\d{2}"
                placeholder="2026-27"
                required
                disabled={busy}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              Add year
            </button>
          </form>
          {yearError && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-red-600">
              {yearError}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
