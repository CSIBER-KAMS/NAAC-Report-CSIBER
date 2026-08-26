import { notFound, redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/session';
import { getYearByLabel } from '@/lib/db';
import { assignedCriteria } from '@/lib/permissions';
import { criterionLabel, CRITERION_SCOPED } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { year: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const scoped = CRITERION_SCOPED.has(user.role);
  const mine = assignedCriteria(user);

  return (
    <div className="flex h-screen">
      <Sidebar year={params.year} user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        {year.status === 'final' && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
            This academic year is marked <strong>Final</strong> — data is
            read-only. An administrator can reopen it from Administration.
          </div>
        )}
        {scoped && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {mine.length === 0 ? (
              <>
                You have not been assigned any criteria yet. You can view the
                AQAR and raise change requests, but not edit. Ask the Head of
                IQAC to assign your criteria.
              </>
            ) : (
              <>
                You can edit{' '}
                <strong>{mine.map(criterionLabel).join(', ')}</strong>
                {user.schoolName ? (
                  <>
                    {' '}
                    for <strong>{user.schoolName}</strong>
                  </>
                ) : null}
                . Everything else is read-only.
              </>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
