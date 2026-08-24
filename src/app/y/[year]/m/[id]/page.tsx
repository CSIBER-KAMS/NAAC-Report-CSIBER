import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMetric } from '@/catalog';
import type { MetricPayload, MetricStatus } from '@/catalog/types';
import { getDb, getMetricPayload, getTableRows, getYearByLabel } from '@/lib/db';
import { evaluateDerivation, validateMetric } from '@/lib/derive';
import MetricForm from '@/components/MetricForm';
import type { Row } from '@/components/RowTable';
import type { EvidenceFile } from '@/components/EvidencePanel';
import { Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  qlm: 'QlM',
  qnm: 'QnM',
  option: 'Option',
};

const KIND_TONE: Record<string, 'blue' | 'green' | 'amber'> = {
  qlm: 'blue',
  qnm: 'green',
  option: 'amber',
};

export default async function MetricPage({
  params,
}: {
  params: { year: string; id: string };
}) {
  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const metricId = decodeURIComponent(params.id);
  const found = getMetric(metricId);
  if (!found) notFound();
  const { criterion, keyIndicator, metric } = found;

  const { payload, status } = getMetricPayload(year.id, metric.id);
  const p = payload as MetricPayload;

  const rows: Record<string, Row[]> = {};
  for (const t of metric.tables ?? []) {
    rows[t.key] = getTableRows(year.id, metric.id, t.key);
  }

  const evidence = getDb()
    .prepare(
      'SELECT id, slot_key, orig_name, size, mime, uploaded_at FROM evidence WHERE year_id = ? AND metric_id = ? ORDER BY id'
    )
    .all(year.id, metric.id) as EvidenceFile[];

  const evidenceCounts: Record<string, number> = {};
  for (const f of evidence) {
    evidenceCounts[f.slot_key] = (evidenceCounts[f.slot_key] ?? 0) + 1;
  }

  const derived = metric.headline?.derive
    ? evaluateDerivation(year.id, metric, metric.headline.derive)
    : null;
  const issues = validateMetric(year.id, metric, p, evidenceCounts);
  const readOnly = year.status === 'final';

  const criterionLabel =
    criterion.number === 0
      ? 'Extended Profile'
      : `Criterion ${criterion.number}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/y/${params.year}/c/${criterion.number}`}
          className="text-sm text-brand-700 hover:underline"
        >
          &larr; {criterionLabel}: {criterion.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{metric.id}</h1>
          <Badge tone={KIND_TONE[metric.kind] ?? 'slate'}>
            {KIND_LABEL[metric.kind] ?? metric.kind}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {keyIndicator.code} &middot; {keyIndicator.title}
        </p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">
          {metric.title}
        </p>
        {metric.notes && (
          <p className="mt-2 text-xs text-slate-500">{metric.notes}</p>
        )}
      </div>

      <MetricForm
        yearLabel={params.year}
        metric={metric}
        initialPayload={p}
        initialStatus={status as MetricStatus}
        initialRows={rows}
        initialEvidence={evidence}
        initialDerived={derived}
        initialIssues={issues}
        readOnly={readOnly}
      />
    </div>
  );
}
