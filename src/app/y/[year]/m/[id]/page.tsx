import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMetric } from '@/catalog';
import type { MetricPayload, MetricStatus } from '@/catalog/types';
import { getDb, getMetricPayload, getTableRows, getYearByLabel } from '@/lib/db';
import { evaluateDerivation, validateMetric } from '@/lib/derive';
import { getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
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
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const metricId = decodeURIComponent(params.id);
  const found = getMetric(metricId);
  if (!found) notFound();
  const { criterion, keyIndicator, metric } = found;
  const criterionNo = criterion.number;

  const { payload, status } = getMetricPayload(year.id, metric.id);
  const p = payload as MetricPayload;

  const rows: Record<string, Row[]> = {};
  for (const t of metric.tables ?? []) {
    rows[t.key] = getTableRows(year.id, metric.id, t.key);
  }

  // uploaded_by comes back so the panel can decide delete rights per file —
  // a School Representative may remove their own uploads and nobody else's.
  const evidence = getDb()
    .prepare(
      'SELECT id, slot_key, orig_name, size, mime, uploaded_by, uploaded_at FROM evidence WHERE year_id = ? AND metric_id = ? ORDER BY id'
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

  const writable = year.status !== 'final';
  const canEdit = writable && can(user, 'metric:edit', { criterion: criterionNo });
  const readOnly = !canEdit;

  // Raising a correction is deliberately NOT tied to edit rights: the whole
  // review loop depends on someone who cannot fix a metric being able to say
  // that it needs fixing.
  const canLogChangeRequest = writable && can(user, 'changeRequest:create');
  const canUpload =
    writable && can(user, 'evidence:upload', { criterion: criterionNo });

  // Two flags rather than a function, because a server component cannot pass
  // a closure to a client component. MetricForm rebuilds the per-file
  // predicate from them. `ownerId: null` deliberately fails the rep's
  // "own uploads only" rule while passing for admin/head/coordinator.
  const canDeleteAnyEvidence =
    writable &&
    can(user, 'evidence:delete', { criterion: criterionNo, ownerId: null });
  const canDeleteOwnEvidence =
    writable &&
    can(user, 'evidence:delete', { criterion: criterionNo, ownerId: user.id });

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

      {readOnly && writable && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Read-only.</strong> {criterionLabel} is not assigned to you.
          You can read everything here and log a change request below, but not
          edit the data or upload evidence.
        </div>
      )}

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
        canLogChangeRequest={canLogChangeRequest}
        canUpload={canUpload}
        canDeleteAnyEvidence={canDeleteAnyEvidence}
        canDeleteOwnEvidence={canDeleteOwnEvidence}
        currentUserId={user.id}
      />
    </div>
  );
}
