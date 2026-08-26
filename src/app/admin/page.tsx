import Link from 'next/link';
import { redirect } from 'next/navigation';
import { canApproveAccounts, getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { getDb } from '@/lib/db';
import AdminClient, {
  type AdminSchool,
  type AdminUser,
  type AdminYear,
  type UserCriterionRow,
} from './admin-client';

export const dynamic = 'force-dynamic';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="text-sm font-semibold text-brand-800">
            CSIBER AQAR System — Administration
          </div>
          <Link
            href="/"
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            &larr; Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Administration is shared: the Administrator provisions accounts, the Head
  // of IQAC approves them and decides who owns which criterion. Each section
  // below is gated separately by `can(...)`, so the two see different controls.
  if (!can(user, 'admin:access')) {
    return (
      <Shell>
        <div className="card max-w-lg">
          <h1 className="text-lg font-semibold text-slate-900">
            Not authorised
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Administration is restricted to the Administrator and the Head of
            IQAC. Ask them if you need an account, a criterion assignment or an
            academic year managed.
          </p>
        </div>
      </Shell>
    );
  }

  const db = getDb();

  // Mirrors USER_SELECT in /api/admin/users so the first paint and every
  // later refresh agree on the shape.
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.school_id,
              s.name AS school_name, u.created_at
         FROM users u
    LEFT JOIN schools s ON s.id = u.school_id
     ORDER BY u.name COLLATE NOCASE`
    )
    .all() as AdminUser[];

  const years = db
    .prepare('SELECT id, label, status, created_at FROM years ORDER BY label DESC')
    .all() as AdminYear[];

  const schools = db
    .prepare(
      `SELECT s.id, s.name, s.code, s.active, s.created_at,
              (SELECT COUNT(*) FROM users u
                WHERE u.school_id = s.id
                  AND u.role = 'school_rep'
                  AND u.status IN ('pending','active')) AS rep_count
         FROM schools s
        ORDER BY s.name COLLATE NOCASE`
    )
    .all() as AdminSchool[];

  // Every assignment in one query: the client groups them by user, so the
  // scope editors render with their current state and no extra round trip.
  const assignments = db
    .prepare(
      'SELECT user_id, criterion FROM user_criteria ORDER BY user_id, criterion'
    )
    .all() as UserCriterionRow[];

  return (
    <Shell>
      <AdminClient
        users={users}
        years={years}
        schools={schools}
        assignments={assignments}
        currentUserId={user.id}
        currentUserRole={user.role}
        canApprove={canApproveAccounts(user)}
      />
    </Shell>
  );
}
