import { notFound } from 'next/navigation';
import { partASections } from '@/catalog';
import { getDb, getYearByLabel } from '@/lib/db';
import PartAForm, { type PartAValues } from '@/components/PartAForm';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PartAPage({
  params,
}: {
  params: { year: string };
}) {
  const year = getYearByLabel(params.year);
  if (!year) notFound();

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
      <PartAForm
        yearLabel={params.year}
        sections={partASections}
        initialPayload={payload}
        readOnly={year.status === 'final'}
      />
    </div>
  );
}
