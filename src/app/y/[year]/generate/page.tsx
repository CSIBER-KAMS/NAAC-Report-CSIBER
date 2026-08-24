import { notFound } from 'next/navigation';
import { getDb, getYearByLabel } from '@/lib/db';
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

export default function GeneratePage({
  params,
}: {
  params: { year: string };
}) {
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

  return (
    <div>
      <PageHeader
        title="Generate AQAR"
        subtitle={`Produce the AQAR ${year.label} document (.docx) from the data currently entered.`}
        actions={<GenerateButton year={params.year} />}
      />

      <div className="card mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          The review loop
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <strong>Generate</strong> a draft document from the current data.
          </li>
          <li>
            <strong>Circulate</strong> it to criterion in-charges and faculty for
            review.
          </li>
          <li>
            <strong>Log change requests</strong> on the Review page as feedback
            comes in.
          </li>
          <li>
            <strong>Fix the data</strong> in the relevant metrics and resolve
            each request.
          </li>
          <li>
            <strong>Regenerate</strong> — every run gets a new version number, so
            you can always tell which printout is current.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Documents are stamped <em>DRAFT v&lt;n&gt;</em> while the year is open.
          {isFinal ? (
            <>
              {' '}
              This year is marked <strong>Final</strong>, so new generations are
              produced as FINAL documents.
            </>
          ) : (
            <>
              {' '}
              Once an administrator marks the year <strong>Final</strong> in
              Administration, generated documents carry the FINAL stamp instead.
            </>
          )}
        </p>
      </div>

      <div className="card p-0">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Generation history
          </h2>
        </div>
        {generations.length === 0 ? (
          <div className="p-5">
            <EmptyState>
              No documents generated yet. Use &ldquo;Generate new version&rdquo;
              to produce the first draft.
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
