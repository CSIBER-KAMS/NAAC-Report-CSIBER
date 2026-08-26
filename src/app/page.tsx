import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listYears } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { ROLE_LABEL, ROLE_PORTAL } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * Entry point after signing in.
 *
 * Sends everyone to the most recent academic year. When none exists yet this
 * used to redirect unconditionally to /admin, which dead-ended anyone without
 * administration rights on a "Not authorised" card with no way forward — so
 * the empty case is now explained in place, per role.
 */
export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const years = listYears();
  if (years.length > 0) {
    redirect(`/y/${years[0].label}`);
  }

  const mayCreate = can(user, 'year:manage');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-lg">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {ROLE_PORTAL[user.role]}
        </div>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          No academic year has been set up yet
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The AQAR is organised by academic year. Once a year is created, data
          entry for Part A, the Extended Profile and Criteria 1&ndash;7 opens up.
        </p>

        {mayCreate ? (
          <div className="mt-5">
            <Link href="/admin" className="btn-primary">
              Create the first academic year
            </Link>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
            You are signed in as <strong>{user.name}</strong> (
            {ROLE_LABEL[user.role]}). Please ask the Head of IQAC to create the
            academic year &mdash; your work can begin as soon as it exists.
          </p>
        )}

        <form action="/api/auth/logout" method="post" className="mt-5">
          <button className="text-xs text-slate-500 underline hover:text-slate-700">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
