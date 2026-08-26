import { notFound, redirect } from 'next/navigation';
import { partASections } from '@/catalog';
import { getDb, getYearByLabel } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import PartAForm, { type PartAValues } from '@/components/PartAForm';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PartAPage({
  params,
}: {
  params: { year: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  // The Sidebar hides this link for criterion-scoped roles, but the route has
  // to hold on its own if someone reaches it by URL.
  const mayEdit = can(user, 'partA:edit');
  const readOnly = year.status === 'final' || !mayEdit;

  const row = getDb()
    .prepare('SELECT payload FROM part_a WHERE year_id = ?')
    .get(year.id) as { payload: string } | undefined;

  let payload: PartAValues = {};
  if (row) {
    try {
      payload = JSON.parse(row.payload) as PartAValues;
    } catch {
      payload = {};
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Part A — Data of the Institution"
        subtitle={`Institutional data for AQAR ${year.label}, as per the NAAC AQAR guideline for Autonomous Colleges.`}
      />
      {!mayEdit && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Read-only.</strong> Part A is institution-level data
          maintained by the Administrator and the Head of IQAC. You can read it
          here; corrections go through the Review / Change Requests page.
        </div>
      )}
      <PartAForm
        yearLabel={params.year}
        sections={partASections}
        initialPayload={payload}
        readOnly={readOnly}
      />
    </div>
  );
}
