import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { allCriteria } from '@/catalog';
import { evidenceCountsForYear, getDb, getYearByLabel } from '@/lib/db';
import { criterionProgress } from '@/lib/derive';
import { getSessionUser } from '@/lib/session';
import { assignedCriteria, can } from '@/lib/permissions';
import { criterionOf } from '@/lib/apiHelpers';
import {
  CRITERION_SCOPED,
  criterionLabel,
  ROLE_LABEL,
  ROLE_PORTAL,
  ROLE_SUMMARY,
  ROLE_THEME,
} from '@/lib/roles';
import { Badge, EmptyState, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface LatestGeneration {
  id: number;
  version: number;
  label: string | null;
  file_path: string;
  created_at: string;
  generated_by_name: string | null;
}

export default async function DashboardPage({
  params,
}: {
  params: { year: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const db = getDb();
  const theme = ROLE_THEME[user.role];

  // A scoped user's dashboard answers "what am I here to do?" — so it shows
  // only the criteria they may actually work on. Unscoped roles keep the full
  // institutional overview.
  const scoped = CRITERION_SCOPED.has(user.role);
  const mine = assignedCriteria(user);
  const mineSet = new Set(mine);
  const visibleCriteria = scoped
    ? allCriteria.filter((c) => mineSet.has(c.number))
    : allCriteria;

  const evidenceByMetric = evidenceCountsForYear(year.id);

  const cards = visibleCriteria.map((criterion) => {
    const progress = criterionProgress(year.id, criterion, evidenceByMetric);
    const total = progress.length;
    const complete = progress.filter((p) => p.status === 'complete').length;
    const withData = progress.filter((p) => p.hasData).length;
    let errors = 0;
    let warnings = 0;
    for (const p of progress) {
      for (const issue of p.issues) {
        if (issue.severity === 'error') errors += 1;
        else warnings += 1;
      }
    }
    return { criterion, total, complete, withData, errors, warnings };
  });

  // Open change requests. Scoped users see the count for their own criteria
  // only, so the number on the tile matches what the Review page will let
  // them act on.
  const openCrRows = db
    .prepare(
      "SELECT metric_id FROM change_requests WHERE year_id = ? AND status = 'open'"
    )
    .all(year.id) as { metric_id: string | null }[];
  const openCrCount = scoped
    ? openCrRows.filter((r) => {
        const c = criterionOf(r.metric_id);
        return c !== undefined && mineSet.has(c);
      }).length
    : openCrRows.length;

  // Only roles that can actually produce a document get the generation tile.
  const showGeneration = can(user, 'generate:draft');

  const latestGen = showGeneration
    ? (db
        .prepare(
          `SELECT g.id, g.version, g.label, g.file_path, g.created_at, u.name AS generated_by_name
       FROM generations g
       LEFT JOIN users u ON u.id = g.generated_by
       WHERE g.year_id = ?
       ORDER BY g.version DESC
       LIMIT 1`
        )
        .get(year.id) as LatestGeneration | undefined)
    : undefined;

  // Approving accounts is the Head's job — surface the queue where they land.
  const showApprovals = can(user, 'user:approve');
  const pendingAccounts = showApprovals
    ? (
        db
          .prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'pending'")
          .get() as { n: number }
      ).n
    : 0;

  return (
    <div>
      <PageHeader
        title={ROLE_PORTAL[user.role]}
        subtitle={`${ROLE_SUMMARY[user.role]} Academic year ${year.label}.`}
        actions={
          <span className={`badge ${theme.chip}`}>{ROLE_LABEL[user.role]}</span>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/y/${params.year}/review`}
          className="card block hover:border-brand-600"
        >
          <div className="text-sm font-medium text-slate-500">
            {scoped ? 'Open change requests on your criteria' : 'Open change requests'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">
              {openCrCount}
            </span>
            {openCrCount > 0 ? (
              <Badge tone="amber">needs attention</Badge>
            ) : (
              <Badge tone="green">all clear</Badge>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Go to Review / Change Requests &rarr;
          </div>
        </Link>

        {showApprovals && (
          <Link href="/admin" className="card block hover:border-brand-600">
            <div className="text-sm font-medium text-slate-500">
              {pendingAccounts === 1
                ? '1 account awaiting your approval'
                : `${pendingAccounts} accounts awaiting your approval`}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">
                {pendingAccounts}
              </span>
              {pendingAccounts > 0 ? (
                <Badge tone="amber">needs approval</Badge>
              ) : (
                <Badge tone="green">all clear</Badge>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Go to Administration &rarr;
            </div>
          </Link>
        )}

        {showGeneration && (
          <Link
            href={`/y/${params.year}/generate`}
            className="card block hover:border-brand-600"
          >
            <div className="text-sm font-medium text-slate-500">
              Latest generated document
            </div>
            {latestGen ? (
              <>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900">
                    v{latestGen.version}
                  </span>
                  <Badge
                    tone={
                      latestGen.file_path.endsWith('-draft.docx')
                        ? 'slate'
                        : 'green'
                    }
                  >
                    {latestGen.file_path.endsWith('-draft.docx')
                      ? 'DRAFT'
                      : 'FINAL'}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {latestGen.created_at}
                  {latestGen.generated_by_name
                    ? ` — by ${latestGen.generated_by_name}`
                    : ''}
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-3xl font-semibold text-slate-400">
                  &mdash;
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  No document generated yet. Go to Generate AQAR &rarr;
                </div>
              </>
            )}
          </Link>
        )}
      </div>

      {scoped && mine.length === 0 ? (
        <EmptyState>
          No criteria have been assigned to you yet, so there is nothing to
          enter here. You can still view the AQAR and raise change requests.
          Ask the Head of IQAC to assign your criteria.
        </EmptyState>
      ) : (
        <>
          {scoped && (
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Your {mine.length === 1 ? 'criterion' : 'criteria'} —{' '}
              {mine.map(criterionLabel).join(', ')}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(
              ({ criterion, total, complete, withData, errors, warnings }) => (
                <Link
                  key={criterion.number}
                  href={`/y/${params.year}/c/${criterion.number}`}
                  className="card block hover:border-brand-600"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {criterion.number === 0
                      ? 'Extended Profile'
                      : `Criterion ${criterion.number} — ${criterion.title}`}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-slate-900">
                      {complete}
                    </span>
                    <span className="text-sm text-slate-500">
                      / {total} complete
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{
                        width: total > 0 ? `${(complete / total) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{withData} with data</span>
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
                    {errors === 0 && warnings === 0 && (
                      <Badge tone="green">no issues</Badge>
                    )}
                  </div>
                </Link>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
