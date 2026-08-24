import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCriterion } from '@/catalog';
import type { MetricKind } from '@/catalog/types';
import { evidenceCountsForYear, getDb, getYearByLabel } from '@/lib/db';
import { criterionProgress, type MetricProgress } from '@/lib/derive';
import { Badge, PageHeader, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<MetricKind, string> = {
  qlm: 'QlM',
  qnm: 'QnM',
  option: 'Option',
};

const KIND_TONE: Record<MetricKind, 'blue' | 'green' | 'slate'> = {
  qlm: 'blue',
  qnm: 'green',
  option: 'slate',
};

function truncate(text: string, max = 110): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

export default function CriterionPage({
  params,
}: {
  params: { year: string; n: string };
}) {
  const year = getYearByLabel(params.year);
  if (!year) notFound();

  if (!/^[0-7]$/.test(params.n)) notFound();
  const n = Number.parseInt(params.n, 10);
  const criterion = getCriterion(n);
  if (!criterion) notFound();

  const evidenceByMetric = evidenceCountsForYear(year.id);
  const progress = criterionProgress(year.id, criterion, evidenceByMetric);
  const progressById = new Map<string, MetricProgress>(
    progress.map((p) => [p.metricId, p])
  );

  const openCrRows = getDb()
    .prepare(
      `SELECT metric_id, COUNT(*) AS n FROM change_requests
       WHERE year_id = ? AND status = 'open' AND metric_id IS NOT NULL
       GROUP BY metric_id`
    )
    .all(year.id) as { metric_id: string; n: number }[];
  const openCrByMetric = new Map(openCrRows.map((r) => [r.metric_id, r.n]));

  const title =
    criterion.number === 0
      ? 'Extended Profile'
      : `Criterion ${criterion.number} — ${criterion.title}`;

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${progress.length} metrics · ${
          progress.filter((p) => p.status === 'complete').length
        } complete`}
      />

      <div className="space-y-6">
        {criterion.keyIndicators.map((ki) => (
          <section key={ki.code} className="card p-0">
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {criterion.number === 0
                  ? ki.title
                  : `Key Indicator ${ki.code} — ${ki.title}`}
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {ki.metrics.map((metric) => {
                const p = progressById.get(metric.id);
                const errors =
                  p?.issues.filter((i) => i.severity === 'error').length ?? 0;
                const warnings =
                  p?.issues.filter((i) => i.severity === 'warning').length ?? 0;
                const files = Object.values(
                  evidenceByMetric[metric.id] ?? {}
                ).reduce((a, b) => a + b, 0);
                const openCrs = openCrByMetric.get(metric.id) ?? 0;
                return (
                  <li key={metric.id}>
                    <Link
                      href={`/y/${params.year}/m/${encodeURIComponent(metric.id)}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-slate-50"
                    >
                      <span className="w-16 shrink-0 text-sm font-semibold text-brand-800">
                        {metric.id}
                      </span>
                      <Badge tone={KIND_TONE[metric.kind]}>
                        {KIND_LABEL[metric.kind]}
                      </Badge>
                      <span
                        className="min-w-0 flex-1 text-sm text-slate-700"
                        title={metric.title}
                      >
                        {truncate(metric.title)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {errors > 0 && (
                          <Badge tone="red">
                            {errors} error{errors === 1 ? '' : 's'}
                          </Badge>
                        )}
                        {warnings > 0 && (
                          <Badge tone="amber">
                            {warnings} warning{warnings === 1 ? '' : 's'}
                          </Badge>
                        )}
                        {openCrs > 0 && (
                          <Badge tone="blue">
                            {openCrs} CR{openCrs === 1 ? '' : 's'}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {files} file{files === 1 ? '' : 's'}
                        </span>
                        <StatusBadge status={p?.status ?? 'empty'} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
