import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getDb, getYearByLabel } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { computeReadiness } from '@/lib/readiness';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import GenerateButton from './generate-button';

export const dynamic = 'force-dynamic';

interface GenerationRow {
  id: number;
  version: number;
  label: string | null;
  file_path: string;
  created_at: string;
  generated_by_name: string | null;
}

function pct(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${(part / total) * 100}%`;
}

export default async function GeneratePage({
  params,
}: {
  params: { year: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const generations = getDb()
    .prepare(
      `SELECT g.id, g.version, g.label, g.file_path, g.created_at,
              u.name AS generated_by_name
       FROM generations g
       LEFT JOIN users u ON u.id = g.generated_by
       WHERE g.year_id = ?
       ORDER BY g.version DESC`
    )
    .all(year.id) as GenerationRow[];

  const isFinal = year.status === 'final';

  // Once the year is final, every run produces the FINAL document — which is
  // the artefact submitted to NAAC, so it is a narrower right than drafting.
  // Downloads below stay open to everyone: circulating drafts for review is
  // the point of the whole loop.
  const canGenerate = can(user, isFinal ? 'generate:final' : 'generate:draft');

  const readiness = computeReadiness(year.id);

  // While the year is open only drafts can be produced, so nothing is
  // actually blocked — but the errors are shown as what they will become, so
  // nobody discovers them for the first time on the day they finalise.
  const blocking = isFinal && !readiness.ready;

  return (
    <div>
      <PageHeader
        title="Generate AQAR"
        subtitle={`Produce the AQAR ${year.label} document (.docx) from the data currently entered.`}
        actions={
          canGenerate ? undefined : (
            <span className="max-w-xs text-right text-xs text-slate-500">
              {isFinal
                ? 'Only the Administrator or Head of IQAC can generate the FINAL document.'
                : 'You do not have permission to generate documents. You can still download any version below.'}
            </span>
          )
        }
      />

      {/* ---- Readiness gate ---------------------------------------------- */}
      <div className="card mb-6 overflow-hidden p-0">
        <div
          className={`h-1 w-full ${
            readiness.ready ? 'bg-green-600' : 'bg-amber-600'
          }`}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  readiness.ready
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
                aria-hidden="true"
              >
                {readiness.ready ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                )}
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {readiness.ready ? 'Ready to submit' : 'Not ready to submit'}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  {readiness.ready ? (
                    <>
                      Nothing blocks the FINAL document.
                      {readiness.warningCount > 0 ? (
                        <>
                          {' '}
                          {readiness.warningCount} warning
                          {readiness.warningCount === 1 ? '' : 's'} remain
                          {readiness.warningCount === 1 ? 's' : ''} — they will
                          not stop generation, but a DVV reviewer will ask about
                          them.
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      Drafts can be generated at any time — circulating an
                      incomplete draft is how review works. The{' '}
                      <strong className="font-semibold text-slate-700">
                        FINAL
                      </strong>{' '}
                      document {isFinal ? 'is blocked' : 'will be blocked'} by{' '}
                      {readiness.blockedReason}.
                    </>
                  )}
                </p>
              </div>
            </div>

            {canGenerate && (
              <div className="shrink-0">
                <GenerateButton
                  year={params.year}
                  isFinal={isFinal}
                  ready={readiness.ready}
                  blockedReason={readiness.blockedReason}
                  warningCount={readiness.warningCount}
                />
              </div>
            )}
          </div>

          {/* Counters */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              className={`rounded-md border px-4 py-3 ${
                readiness.errorCount > 0
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  readiness.errorCount > 0 ? 'text-red-800' : 'text-green-800'
                }`}
              >
                Blocking errors
              </div>
              <div
                className={`mt-0.5 text-3xl font-semibold ${
                  readiness.errorCount > 0 ? 'text-red-800' : 'text-green-800'
                }`}
              >
                {readiness.errorCount}
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-medium text-amber-800">Warnings</div>
              <div className="mt-0.5 text-3xl font-semibold text-amber-800">
                {readiness.warningCount}
              </div>
            </div>

            {/* Blank metrics block the FINAL just as errors do — a submitted
                AQAR cannot have empty metrics, so this tile is styled as a
                blocker rather than as neutral progress. */}
            <Link
              href={`/y/${params.year}/checklist`}
              className={`rounded-md border px-4 py-3 ${
                readiness.notStarted > 0
                  ? 'border-red-200 bg-red-50 hover:border-red-400'
                  : 'border-green-200 bg-green-50 hover:border-green-400'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  readiness.notStarted > 0 ? 'text-red-800' : 'text-green-800'
                }`}
              >
                Metrics with no data
              </div>
              <div
                className={`mt-0.5 text-3xl font-semibold ${
                  readiness.notStarted > 0 ? 'text-red-800' : 'text-green-800'
                }`}
              >
                {readiness.notStarted}
              </div>
            </Link>

            <Link
              href={`/y/${params.year}/review`}
              className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 hover:border-brand-600"
            >
              <div className="text-xs font-medium text-slate-600">
                Open change requests
              </div>
              <div className="mt-0.5 text-3xl font-semibold text-slate-700">
                {readiness.openChangeRequests}
              </div>
            </Link>
          </div>

          {/* Completeness across every metric */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="text-xs font-medium text-slate-600">
                {readiness.complete} of {readiness.totalMetrics} metrics complete
              </div>
              <div className="text-xs text-slate-500">
                Extended Profile and Criteria 1–7
              </div>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-green-600"
                style={{ width: pct(readiness.complete, readiness.totalMetrics) }}
              />
              <div
                className="bg-amber-600"
                style={{
                  width: pct(readiness.inProgress, readiness.totalMetrics),
                }}
              />
              <div
                className="bg-slate-300"
                style={{
                  width: pct(readiness.notStarted, readiness.totalMetrics),
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                Complete {readiness.complete}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                In progress {readiness.inProgress}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Not started {readiness.notStarted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Blocking errors --------------------------------------------- */}
      {readiness.errorCount > 0 && (
        <div className="card mb-6 p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {blocking ? 'Blocking errors' : 'Errors that will block the FINAL'}
            </h2>
            <Badge tone="red">{readiness.errorCount}</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {readiness.errors.map((issue, i) => (
              <div
                key={`${issue.metricId}-${i}`}
                className="flex items-start justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Link
                    href={`/y/${params.year}/m/${encodeURIComponent(issue.metricId)}`}
                    className="w-14 shrink-0 text-sm font-medium text-brand-800 hover:underline"
                  >
                    {issue.metricId}
                  </Link>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700">{issue.message}</div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {issue.context}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/y/${params.year}/m/${encodeURIComponent(issue.metricId)}`}
                  className="btn-secondary shrink-0 px-3 py-1 text-xs"
                >
                  Fix
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Warnings ----------------------------------------------------- */}
      {readiness.warningCount > 0 && (
        <div className="card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Warnings</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                These do not block generation, but DVV will question them. The{' '}
                <Link
                  href={`/y/${params.year}/checklist`}
                  className="text-brand-800 hover:underline"
                >
                  Portal Checklist
                </Link>{' '}
                lists them per metric.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {readiness.warningGroups.map((g) => (
                <Badge key={g.code} tone="amber">
                  {g.count} {g.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Generation history ------------------------------------------- */}
      <div className="card p-0">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Generation history
          </h2>
        </div>
        {generations.length === 0 ? (
          <div className="p-5">
            <EmptyState>
              {canGenerate ? (
                <>
                  No documents generated yet. Use &ldquo;Generate new
                  draft&rdquo; above to produce the first one.
                </>
              ) : (
                <>
                  No documents generated yet. Once a draft is produced it will
                  appear here for you to download.
                </>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2 font-medium">Version</th>
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">Label</th>
                  <th className="px-5 py-2 font-medium">Generated</th>
                  <th className="px-5 py-2 font-medium">By</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generations.map((g) => {
                  const draft = g.file_path.endsWith('-draft.docx');
                  return (
                    <tr key={g.id}>
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                        v{g.version}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {draft ? (
                          <Badge tone="slate">DRAFT</Badge>
                        ) : (
                          <Badge tone="green">FINAL</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {g.label ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {g.created_at}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {g.generated_by_name ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <a
                          href={`/api/generations/${g.id}/download`}
                          className="btn-secondary px-3 py-1 text-xs"
                        >
                          Download .docx
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
