'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface MetricOption {
  id: string;
  label: string;
}

/** Form to log a new change request against the current year. */
export function NewChangeRequestForm({
  year,
  metricOptions,
  disabled,
}: {
  year: string;
  metricOptions: MetricOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [metricId, setMetricId] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError('A note describing the requested change is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/change-requests?year=${encodeURIComponent(year)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metricId: metricId || undefined,
            source: source.trim() || undefined,
            note: note.trim(),
          }),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setMetricId('');
      setSource('');
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Metric (optional)
          </label>
          <select
            className="input"
            value={metricId}
            onChange={(e) => setMetricId(e.target.value)}
            disabled={disabled || busy}
          >
            <option value="">— General / not metric-specific —</option>
            {metricOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Source (who asked for this?)
          </label>
          <input
            className="input"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Prof. X, Dept. of Commerce"
            disabled={disabled || busy}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Requested change
        </label>
        <textarea
          className="input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what needs to change and why"
          disabled={disabled || busy}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button type="submit" className="btn-primary" disabled={disabled || busy}>
          {busy ? 'Logging…' : 'Log change request'}
        </button>
      </div>
    </form>
  );
}

/**
 * Resolve button for one open change request, with an optional note prompt.
 *
 * Closing a request is a separate right from raising one — a School
 * Representative may report a problem but not declare it fixed, and a
 * Coordinator may only close requests on their own criteria. When the viewer
 * lacks that right we show the reason in place of the button rather than a
 * dead grey control.
 */
export function ResolveButton({
  id,
  canResolve = true,
  deniedLabel = 'Not yours to close',
  deniedReason,
  disabled,
}: {
  id: number;
  /** False when this row is outside the viewer's scope. */
  canResolve?: boolean;
  /** Short text shown in place of the button when `canResolve` is false. */
  deniedLabel?: string;
  /** Tooltip explaining why the button is not offered. */
  deniedReason?: string;
  /** Temporarily unavailable for a reason other than permission (e.g. busy). */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolve() {
    const note = window.prompt(
      'Resolution note (optional) — what was changed?',
      ''
    );
    if (note === null) return; // cancelled
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolutionNote: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  if (!canResolve) {
    return (
      <span className="text-xs text-slate-400" title={deniedReason}>
        {deniedLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn-secondary px-3 py-1 text-xs"
        onClick={resolve}
        disabled={disabled || busy}
      >
        {busy ? 'Resolving…' : 'Resolve'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
