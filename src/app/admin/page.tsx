import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import AdminClient, { type AdminUser, type AdminYear } from './admin-client';

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
  const user = await currentUser();

  if (!user || user.role !== 'admin') {
    return (
      <Shell>
        <div className="card max-w-lg">
          <h1 className="text-lg font-semibold text-slate-900">
            Not authorised
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Administration is restricted to admin accounts. Ask an IQAC
            administrator if you need users or academic years managed.
          </p>
        </div>
      </Shell>
    );
  }

  const db = getDb();
  const users = db
    .prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name COLLATE NOCASE'
    )
    .all() as AdminUser[];
  const years = db
    .prepare('SELECT id, label, status, created_at FROM years ORDER BY label DESC')
    .all() as AdminYear[];

  return (
    <Shell>
      <AdminClient
        initialUsers={users}
        initialYears={years}
        currentUserId={user.id}
      />
    </Shell>
  );
}
