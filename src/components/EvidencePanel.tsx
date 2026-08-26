'use client';

import { useState } from 'react';
import type { EvidenceSlot } from '@/catalog/types';
import { Badge } from '@/components/ui';

export interface EvidenceFile {
  id: number;
  slot_key: string;
  orig_name: string;
  size: number;
  mime?: string | null;
  /** Who uploaded it — drives the "own uploads only" delete rule. */
  uploaded_by?: number | null;
  uploaded_at: string;
}

/** Normalise an uploader id from the API to `number | null` — never NaN. */
function toOwnerId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * One card per evidence slot: uploaded files with download/delete,
 * a file input + upload button, and a "Required" badge when the slot
 * is required and empty.
 *
 * Upload and delete are gated separately, and delete is decided PER FILE —
 * a School Representative may remove what they uploaded themselves while
 * leaving everyone else's files alone. Downloads and the required-slot badges
 * stay visible to every signed-in viewer.
 */
export default function EvidencePanel({
  yearLabel,
  metricId,
  slots,
  initialFiles,
  canUpload,
  canDeleteFile,
}: {
  yearLabel: string;
  metricId: string;
  slots: EvidenceSlot[];
  initialFiles: EvidenceFile[];
  canUpload: boolean;
  canDeleteFile: (file: { id: number; uploadedBy: number | null }) => boolean;
}) {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const [pending, setPending] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped per slot after a successful upload to reset the <input type=file>.
  const [inputVersion, setInputVersion] = useState<Record<string, number>>({});

  async function refresh() {
    const res = await fetch(
      `/api/evidence?year=${encodeURIComponent(yearLabel)}&metric=${encodeURIComponent(metricId)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const list: unknown[] = Array.isArray(data)
      ? data
      : data.evidence ?? data.rows ?? [];
    // The API returns camelCase rows (slotKey, origName, uploadedAt);
    // normalise to the snake_case EvidenceFile shape used by this panel.
    setFiles(
      list.map((raw) => {
        const r = raw as Record<string, unknown>;
        return {
          id: Number(r.id),
          slot_key: String(r.slot_key ?? r.slotKey ?? ''),
          orig_name: String(r.orig_name ?? r.origName ?? ''),
          size: Number(r.size ?? 0),
          mime: (r.mime ?? null) as string | null,
          uploaded_by: toOwnerId(r.uploaded_by ?? r.uploadedBy),
          uploaded_at: String(r.uploaded_at ?? r.uploadedAt ?? ''),
        };
      })
    );
  }

  async function upload(slotKey: string) {
    const file = pending[slotKey];
    if (!file) return;
    setError(null);
    setBusy(slotKey);
    try {
      const fd = new FormData();
      fd.append('year', yearLabel);
      fd.append('metric', metricId);
      fd.append('slot', slotKey);
      fd.append('file', file);
      const res = await fetch('/api/evidence', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
      setPending((p) => ({ ...p, [slotKey]: null }));
      setInputVersion((v) => ({ ...v, [slotKey]: (v[slotKey] ?? 0) + 1 }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    setError(null);
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  if (slots.length === 0) return null;

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {slots.map((slot) => {
        const slotFiles = files.filter((f) => f.slot_key === slot.key);
        return (
          <div
            key={slot.key}
            className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">{slot.label}</p>
              {slot.required && slotFiles.length === 0 && (
                <Badge tone="red">Required</Badge>
              )}
            </div>
            {slotFiles.length > 0 && (
              <ul className="mb-2 space-y-1">
                {slotFiles.map((f) => {
                  const deletable = canDeleteFile({
                    id: f.id,
                    uploadedBy: f.uploaded_by ?? null,
                  });
                  return (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
                    >
                      <a
                        href={`/api/evidence/${f.id}/download`}
                        className="truncate text-brand-700 hover:underline"
                      >
                        {f.orig_name}
                      </a>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {formatSize(f.size)}
                        </span>
                        {deletable && (
                          <button
                            type="button"
                            className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                            disabled={busy === `del-${f.id}`}
                            onClick={() => remove(f.id)}
                          >
                            Delete
                          </button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {canUpload && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  key={inputVersion[slot.key] ?? 0}
                  type="file"
                  className="text-xs text-slate-600 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2.5 file:py-1 file:text-xs file:text-slate-700 hover:file:bg-slate-100"
                  onChange={(e) =>
                    setPending((p) => ({
                      ...p,
                      [slot.key]: e.target.files?.[0] ?? null,
                    }))
                  }
                />
                <button
                  type="button"
                  className="btn-primary px-3 py-1.5 text-xs"
                  disabled={!pending[slot.key] || busy === slot.key}
                  onClick={() => upload(slot.key)}
                >
                  {busy === slot.key ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
