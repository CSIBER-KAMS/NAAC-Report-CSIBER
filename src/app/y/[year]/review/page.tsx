import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { allMetrics } from '@/catalog';
import { getDb, getYearByLabel } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { criterionOf } from '@/lib/apiHelpers';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import {
  NewChangeRequestForm,
  ResolveButton,
  type MetricOption,
} from './review-form';

export const dynamic = 'force-dynamic';

interface CrRow {
  id: number;
  metric_id: string | null;
  source: string | null;
  note: string;
  status: 'open' | 'resolved';
  created_by_name: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

/** Human-readable age of an SQLite UTC datetime string. */
function ageOf(sqliteUtc: string): string {
  const then = Date.parse(sqliteUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(then)) return sqliteUtc;
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function truncate(text: string, max = 70): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

export default async function ReviewPage({
  params,
}: {
  params: { year: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const year = getYearByLabel(params.year);
  if (!year) notFound();

  const db = getDb();
  const selectCrs = db.prepare(
    `SELECT cr.id, cr.metric_id, cr.source, cr.note, cr.status,
            u.name AS created_by_name, cr.created_at, cr.resolved_at, cr.resolution_note
     FROM change_requests cr
     LEFT JOIN users u ON u.id = cr.created_by
     WHERE cr.year_id = ? AND cr.status = ?
     ORDER BY cr.created_at DESC, cr.id DESC`
  );
  const open = selectCrs.all(year.id, 'open') as CrRow[];
  const resolved = selectCrs.all(year.id, 'resolved') as CrRow[];

  const metricOptions: MetricOption[] = allMetrics().map(({ metric }) => ({
    id: metric.id,
    label: `${metric.id} — ${truncate(metric.title)}`,
  }));

  const writable = year.status !== 'final';

  // Raising a request and closing one are different rights. Everyone signed in
  // may raise; only the people who own the criterion may close.
  const canLog = writable && can(user, 'changeRequest:create');
  const canResolve = (cr: CrRow): boolean =>
    writable &&
    can(user, 'changeRequest:resolve', {
      criterion: criterionOf(cr.metric_id),
    });

  return (
    <div>
      <PageHeader
        title="Review / Change Requests"
        subtitle="Log feedback from faculty review of circulated drafts, fix the data, then regenerate."
      />

      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Log a new change request
        </h2>
        {canLog ? (
          <NewChangeRequestForm year={params.year} metricOptions={metricOptions} />
        ) : (
          <p className="text-sm text-slate-500">
            {writable
              ? 'You do not have permission to log change requests.'
              : 'This year is marked final — change requests can no longer be logged.'}
          </p>
        )}
      </div>

      <div className="card mb-6 p-0">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Open requests</h2>
          <Badge tone={open.length > 0 ? 'amber' : 'green'}>{open.length}</Badge>
        </div>
        {open.length === 0 ? (
          <div className="p-5">
            <EmptyState>No open change requests — the queue is clear.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2 font-medium">Metric</th>
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-5 py-2 font-medium">Note</th>
                  <th className="px-5 py-2 font-medium">Logged</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {open.map((cr) => (
                  <tr key={cr.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3">
                      {cr.metric_id ? (
                        <Link
                          href={`/y/${params.year}/m/${encodeURIComponent(cr.metric_id)}`}
                          className="font-medium text-brand-800 hover:underline"
                        >
                          {cr.metric_id}
                        </Link>
                      ) : (
                        <span className="text-slate-400">General</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cr.source ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="max-w-md px-5 py-3 text-slate-700">
                      {cr.note}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                      {ageOf(cr.created_at)}
                      {cr.created_by_name ? (
                        <span className="block">by {cr.created_by_name}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <ResolveButton
                        id={cr.id}
                        canResolve={canResolve(cr)}
                        deniedLabel={writable ? 'Not yours to close' : 'Year final'}
                        deniedReason={
                          writable
                            ? 'Only the criterion in-charge, the Head of IQAC or an Administrator can close this request.'
                            : 'This year is marked final — nothing can be resolved.'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <details className="card p-0">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-slate-900">
          Resolved history ({resolved.length})
        </summary>
        {resolved.length === 0 ? (
          <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
            Nothing resolved yet.
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2 font-medium">Metric</th>
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-5 py-2 font-medium">Note</th>
                  <th className="px-5 py-2 font-medium">Resolution</th>
                  <th className="px-5 py-2 font-medium">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resolved.map((cr) => (
                  <tr key={cr.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3">
                      {cr.metric_id ? (
                        <Link
                          href={`/y/${params.year}/m/${encodeURIComponent(cr.metric_id)}`}
                          className="font-medium text-brand-800 hover:underline"
                        >
                          {cr.metric_id}
                        </Link>
                      ) : (
                        <span className="text-slate-400">General</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cr.source ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="max-w-sm px-5 py-3 text-slate-700">{cr.note}</td>
                    <td className="max-w-sm px-5 py-3 text-slate-600">
                      {cr.resolution_note ?? (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                      {cr.resolved_at ? ageOf(cr.resolved_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
