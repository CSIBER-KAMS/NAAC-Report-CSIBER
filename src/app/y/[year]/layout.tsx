import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { currentUser } from '@/lib/auth';
import { getYearByLabel } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { year: string };
}) {
  const year = getYearByLabel(params.year);
  if (!year) notFound();
  const user = await currentUser();
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
        {children}
      </main>
    </div>
  );
}
