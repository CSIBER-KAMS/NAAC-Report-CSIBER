'use client';

import { useState } from 'react';
import type {
  Metric,
  MetricPayload,
  MetricStatus,
  ValidationIssue,
} from '@/catalog/types';
import RowTable, { type Row } from '@/components/RowTable';
import EvidencePanel, { type EvidenceFile } from '@/components/EvidencePanel';
import { Badge } from '@/components/ui';

/** Whitespace-token word count (matches the server's countWords). */
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface Props {
  yearLabel: string;
  metric: Metric;
  initialPayload: MetricPayload;
  initialStatus: MetricStatus;
  initialRows: Record<string, Row[]>;
  initialEvidence: EvidenceFile[];
  initialDerived: number | null;
  initialIssues: ValidationIssue[];
  /** Gates the data entry itself: write-ups, tables, headline, status, Save. */
  readOnly?: boolean;
  /**
   * Gates the "Log change request" card ONLY. Deliberately separate from
   * `readOnly`: a School Representative or an unassigned Coordinator must be
   * able to flag a problem on a metric they cannot edit — that is the review
   * loop. Defaults to `!readOnly` so existing callers behave as before.
   */
  canLogChangeRequest?: boolean;
  /** Gates the evidence file input + Upload button. */
  canUpload?: boolean;
  /** May delete any evidence file on this metric (admin / head / coordinator). */
  canDeleteAnyEvidence?: boolean;
  /** May delete evidence they uploaded themselves (school representative). */
  canDeleteOwnEvidence?: boolean;
  /** Needed to match uploads against the viewer for the "own uploads" rule. */
  currentUserId?: number | null;
}

export default function MetricForm({
  yearLabel,
  metric,
  initialPayload,
  initialStatus,
  initialRows,
  initialEvidence,
  initialDerived,
  initialIssues,
  readOnly = false,
  canLogChangeRequest,
  canUpload,
  canDeleteAnyEvidence,
  canDeleteOwnEvidence,
  currentUserId = null,
}: Props) {
  const hasDerive = !!metric.headline?.derive;

  const mayLogChangeRequest = canLogChangeRequest ?? !readOnly;
  const mayUpload = canUpload ?? !readOnly;
  const deleteAny = canDeleteAnyEvidence ?? !readOnly;
  const deleteOwn = canDeleteOwnEvidence ?? !readOnly;

  // Built here rather than passed in, because a server component cannot hand
  // a function to a client component.
  function canDeleteFile(file: { id: number; uploadedBy: number | null }) {
    if (deleteAny) return true;
    return (
      deleteOwn &&
      currentUserId != null &&
      file.uploadedBy != null &&
      file.uploadedBy === currentUserId
    );
  }

  const [writeups, setWriteups] = useState<Record<string, string>>(
    initialPayload.writeups ?? {}
  );
  const [optionChoice, setOptionChoice] = useState<string>(
    initialPayload.optionChoice ?? ''
  );
  const [urls, setUrls] = useState<Record<string, string>>(
    initialPayload.urls ?? {}
  );
  const [override, setOverride] = useState<boolean>(
    hasDerive
      ? initialPayload.headlineOverride !== undefined &&
          initialPayload.headlineOverride !== null
      : true
  );
  const [overrideValue, setOverrideValue] = useState<string>(
    initialPayload.headlineOverride !== undefined &&
      initialPayload.headlineOverride !== null
      ? String(initialPayload.headlineOverride)
      : ''
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    initialPayload.headlineOverrideReason ?? ''
  );
  const [status, setStatus] = useState<MetricStatus>(initialStatus);
  const [rowsByTable, setRowsByTable] =
    useState<Record<string, Row[]>>(initialRows);
  const [derived, setDerived] = useState<number | null>(initialDerived);
  const [issues, setIssues] = useState<ValidationIssue[]>(initialIssues);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Change-request quick log
  const [crSource, setCrSource] = useState('');
  const [crNote, setCrNote] = useState('');
  const [crBusy, setCrBusy] = useState(false);
  const [crMessage, setCrMessage] = useState<string | null>(null);

  const qs = `year=${encodeURIComponent(yearLabel)}&id=${encodeURIComponent(metric.id)}`;

  function buildPayload(): MetricPayload {
    const payload: MetricPayload = {};
    if (metric.writeups?.length) payload.writeups = writeups;
    if (metric.urls?.length) payload.urls = urls;
    // The API merges the payload over the stored one and JSON drops
    // undefined keys, so clearing a field must send '' / null explicitly.
    if (metric.optionSelect) payload.optionChoice = optionChoice;
    if (metric.headline) {
      const trimmed = overrideValue.trim();
      const n = trimmed === '' ? NaN : Number(trimmed);
      payload.headlineOverride =
        override && trimmed !== '' && isFinite(n) ? n : null;
      payload.headlineOverrideReason =
        hasDerive && override && overrideReason.trim()
          ? overrideReason.trim()
          : '';
    }
    return payload;
  }

  async function save() {
    setError(null);
    setSavedAt(null);
    if (
      hasDerive &&
      override &&
      overrideValue.trim() !== '' &&
      !overrideReason.trim()
    ) {
      setError(
        'An override reason is required when replacing the computed headline value.'
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/metric?${qs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: buildPayload(), status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      for (const t of metric.tables ?? []) {
        const r = await fetch(
          `/api/rows?year=${encodeURIComponent(yearLabel)}&metric=${encodeURIComponent(metric.id)}&table=${encodeURIComponent(t.key)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: rowsByTable[t.key] ?? [] }),
          }
        );
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Saving table "${t.title ?? t.key}" failed (${r.status})`
          );
        }
      }
      // Refresh derived value + validation issues from the server.
      const refresh = await fetch(`/api/metric?${qs}`);
      if (refresh.ok) {
        const data = await refresh.json();
        if (data.derived && typeof data.derived.value !== 'undefined') {
          setDerived(data.derived.value ?? null);
        }
        if (Array.isArray(data.issues)) setIssues(data.issues);
        if (data.rows && typeof data.rows === 'object') {
          setRowsByTable(data.rows as Record<string, Row[]>);
        }
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function logChangeRequest() {
    if (!crNote.trim()) {
      setCrMessage('A note describing the requested change is required.');
      return;
    }
    setCrBusy(true);
    setCrMessage(null);
    try {
      const res = await fetch(
        `/api/change-requests?year=${encodeURIComponent(yearLabel)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metricId: metric.id,
            source: crSource.trim() || undefined,
            note: crNote.trim(),
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setCrNote('');
      setCrMessage('Change request logged.');
    } catch (e) {
      setCrMessage(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setCrBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Validation issues */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Validation
        </h2>
        {issues.length === 0 ? (
          <p className="text-sm text-green-700">No validation issues.</p>
        ) : (
          <ul className="space-y-1.5">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge tone={issue.severity === 'error' ? 'red' : 'amber'}>
                  {issue.severity === 'error' ? 'Error' : 'Warning'}
                </Badge>
                <span className="text-slate-700">{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Write-ups */}
      {(metric.writeups ?? []).map((w) => {
        const text = writeups[w.key] ?? '';
        const words = countWords(text);
        const over = !!w.wordLimit && words > w.wordLimit;
        return (
          <div key={w.key} className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                {w.label ?? 'Write-up'}
              </h2>
              <span
                className={`text-xs ${over ? 'font-semibold text-red-600' : 'text-slate-500'}`}
              >
                {words}
                {w.wordLimit ? ` / ${w.wordLimit}` : ''} words
              </span>
            </div>
            <textarea
              rows={8}
              className={`input ${over ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={text}
              disabled={readOnly}
              onChange={(e) =>
                setWriteups((prev) => ({ ...prev, [w.key]: e.target.value }))
              }
            />
            {over && (
              <p className="mt-1 text-xs text-red-600">
                Over the {w.wordLimit}-word limit.
              </p>
            )}
          </div>
        );
      })}

      {/* Option select */}
      {metric.optionSelect && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            {metric.optionSelect.label ?? 'Select one option'}
          </h2>
          <div className="space-y-1.5">
            {metric.optionSelect.options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"
              >
                <input
                  type="radio"
                  name={`option-${metric.id}`}
                  className="mt-0.5"
                  checked={optionChoice === opt}
                  disabled={readOnly}
                  onChange={() => setOptionChoice(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {optionChoice && !readOnly && (
            <button
              type="button"
              className="mt-2 text-xs text-slate-500 hover:text-slate-700 hover:underline"
              onClick={() => setOptionChoice('')}
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Headline */}
      {metric.headline && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            {metric.headline.label}
          </h2>
          {hasDerive ? (
            <>
              <p className="text-sm text-slate-700">
                Computed from the data table:{' '}
                <span className="text-base font-semibold text-slate-900">
                  {derived ?? '—'}
                </span>
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={override}
                  disabled={readOnly}
                  onChange={(e) => setOverride(e.target.checked)}
                />
                Override the computed value
              </label>
              {override && (
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Override value
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={overrideValue}
                      disabled={readOnly}
                      onChange={(e) => setOverrideValue(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Reason for override{' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Why does the reported value differ from the table?"
                      value={overrideReason}
                      disabled={readOnly}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="max-w-xs">
              <input
                type="number"
                className="input"
                value={overrideValue}
                disabled={readOnly}
                onChange={(e) => setOverrideValue(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Data tables */}
      {(metric.tables ?? []).map((t) => (
        <div key={t.key} className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            {t.title ?? 'Data table'}
            {t.sheetRef && (
              <span className="ml-2 font-normal text-slate-400">
                (template sheet {t.sheetRef})
              </span>
            )}
          </h2>
          <RowTable
            table={t}
            rows={rowsByTable[t.key] ?? []}
            readOnly={readOnly}
            onChange={(rows) =>
              setRowsByTable((prev) => ({ ...prev, [t.key]: rows }))
            }
          />
        </div>
      ))}

      {/* URL fields */}
      {(metric.urls ?? []).length > 0 && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Links</h2>
          <div className="space-y-3">
            {(metric.urls ?? []).map((u) => (
              <div key={u.key}>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {u.label}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://"
                  value={urls[u.key] ?? ''}
                  disabled={readOnly}
                  onChange={(e) =>
                    setUrls((prev) => ({ ...prev, [u.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {(metric.evidence ?? []).length > 0 && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Evidence uploads
          </h2>
          <EvidencePanel
            yearLabel={yearLabel}
            metricId={metric.id}
            slots={metric.evidence ?? []}
            initialFiles={initialEvidence}
            canUpload={mayUpload}
            canDeleteFile={canDeleteFile}
          />
        </div>
      )}

      {/* Status + save */}
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Entry status
            </label>
            <select
              className="input w-48"
              value={status}
              disabled={readOnly}
              onChange={(e) => setStatus(e.target.value as MetricStatus)}
            >
              <option value="empty">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && !error && (
              <span className="text-xs text-green-700">Saved at {savedAt}</span>
            )}
            <button
              type="button"
              className="btn-primary"
              disabled={readOnly || saving}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Change-request quick log — gated on its own permission, not on
          `readOnly`, so people who cannot edit can still report a problem. */}
      {mayLogChangeRequest && (
        <div className="card">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">
            Log change request
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            {readOnly
              ? 'You cannot edit this metric, but you can ask whoever can to change it — your request appears in the review queue.'
              : 'Record a correction or update requested for this metric — it will appear in the review queue.'}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              className="input"
              placeholder="Source (e.g. Prof. X, Dept. Y)"
              value={crSource}
              disabled={crBusy}
              onChange={(e) => setCrSource(e.target.value)}
            />
            <input
              type="text"
              className="input md:col-span-2"
              placeholder="What needs to change?"
              value={crNote}
              disabled={crBusy}
              onChange={(e) => setCrNote(e.target.value)}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={crBusy}
              onClick={logChangeRequest}
            >
              {crBusy ? 'Logging…' : 'Log change request'}
            </button>
            {crMessage && (
              <span className="text-xs text-slate-600">{crMessage}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
