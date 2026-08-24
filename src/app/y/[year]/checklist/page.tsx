import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allCriteria } from '@/catalog';
import type { Metric, MetricKind, MetricPayload } from '@/catalog/types';
import {
  evidenceCountsForYear,
  getDb,
  getMetricPayload,
  getYearByLabel,
} from '@/lib/db';
import {
  countWords,
  effectiveHeadline,
  validateMetric,
} from '@/lib/derive';
import { Badge, PageHeader, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<MetricKind, string> = {
  qlm: 'QlM',
  qnm: 'QnM',
  option: 'Option',
};

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/** The "final value" cell: headline number / option choice / word counts. */
function finalValue(
  yearId: number,
  metric: Metric,
  payload: MetricPayload
): string {
  const parts: string[] = [];
  if (metric.headline) {
    const value = effectiveHeadline(yearId, metric, payload);
    const overridden =
      payload.headlineOverride !== undefined && payload.headlineOverride !== null;
    parts.push(
      value === null ? '—' : `${value}${overridden ? ' (manual)' : ''}`
    );
  }
  if (metric.optionSelect) {
    parts.push(payload.optionChoice ? truncate(payload.optionChoice) : 'no option chosen');
  }
  for (const w of metric.writeups ?? []) {
    const words = countWords(payload.writeups?.[w.key] ?? '');
    parts.push(`${w.key}: ${words}${w.wordLimit ? `/${w.wordLimit}` : ''}`);
  }
  return parts.length > 0 ? parts.join('; ') : '—';
}

export default function ChecklistPage({
  params,
}: {
  params: { year: string };
}) {
  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const evidenceByMetric = evidenceCountsForYear(year.id);

  const latestGen = getDb()
    .prepare(
      'SELECT id, version FROM generations WHERE year_id = ? ORDER BY version DESC LIMIT 1'
    )
    .get(year.id) as { id: number; version: number } | undefined;

  const rows = allCriteria.flatMap((criterion) =>
    criterion.keyIndicators.flatMap((ki) =>
      ki.metrics.map((metric) => {
        const { payload, status } = getMetricPayload(year.id, metric.id);
        const p = payload as MetricPayload;
        const evidenceCounts = evidenceByMetric[metric.id] ?? {};
        const issues = validateMetric(year.id, metric, p, evidenceCounts);
        const files = Object.values(evidenceCounts).reduce((a, b) => a + b, 0);
        const slots = metric.evidence?.length ?? 0;
        const urlTotal = metric.urls?.length ?? 0;
        const urlFilled = (metric.urls ?? []).filter(
          (u) => (p.urls?.[u.key] ?? '').trim() !== ''
        ).length;
        return {
          metric,
          status,
          value: finalValue(year.id, metric, p),
          files,
          slots,
          urlFilled,
          urlTotal,
          errors: issues.filter((i) => i.severity === 'error').length,
          warnings: issues.filter((i) => i.severity === 'warning').length,
        };
      })
    )
  );

  return (
    <div>
      <PageHeader
        title="Portal Checklist"
        subtitle="Every metric at a glance — what will go into the AQAR portal and where the gaps are."
        actions={
          <>
            {latestGen ? (
              <a
                href={`/api/generations/${latestGen.id}/download`}
                className="btn-primary"
              >
                Download AQAR (v{latestGen.version})
              </a>
            ) : (
              <span
                className="btn-primary pointer-events-none opacity-50"
                aria-disabled="true"
                title="No document has been generated yet"
              >
                Download AQAR
              </span>
            )}
            <a
              href={`/api/export-templates?year=${encodeURIComponent(params.year)}`}
              className="btn-secondary"
            >
              Export data templates (.xlsx)
            </a>
          </>
        }
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 font-medium">Metric</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Final value</th>
              <th className="px-4 py-2 font-medium">Evidence</th>
              <th className="px-4 py-2 font-medium">URLs</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.metric.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2">
                  <Link
                    href={`/y/${params.year}/m/${encodeURIComponent(row.metric.id)}`}
                    className="font-medium text-brand-800 hover:underline"
                    title={row.metric.title}
                  >
                    {row.metric.id}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {KIND_LABEL[row.metric.kind]}
                </td>
                <td className="max-w-xs px-4 py-2 text-slate-700">{row.value}</td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {row.slots > 0 ? (
                    <span className={row.files === 0 ? 'text-slate-400' : ''}>
                      {row.files} file{row.files === 1 ? '' : 's'} / {row.slots}{' '}
                      slot{row.slots === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {row.urlTotal > 0 ? (
                    <span className={row.urlFilled === 0 ? 'text-slate-400' : ''}>
                      {row.urlFilled}/{row.urlTotal}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <StatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <span className="flex items-center gap-1">
                    {row.errors > 0 && <Badge tone="red">{row.errors}</Badge>}
                    {row.warnings > 0 && (
                      <Badge tone="amber">{row.warnings}</Badge>
                    )}
                    {row.errors === 0 && row.warnings === 0 && (
                      <span className="text-slate-400">—</span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
