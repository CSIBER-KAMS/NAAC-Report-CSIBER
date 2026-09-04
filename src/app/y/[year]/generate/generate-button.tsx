'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * The generate action, sitting inside the readiness card.
 *
 * Whether a run produces a DRAFT or the FINAL document is decided by the
 * year's status, not by this button — see POST /api/generate. So the gate
 * only bites in FINAL mode: drafts are never blocked, because circulating an
 * incomplete document is exactly how the review loop works.
 *
 * Everything disabled here is also refused by the endpoint. This is the
 * courtesy copy, not the enforcement.
 */
export default function GenerateButton({
  year,
  isFinal,
  ready,
  blockedReason,
  warningCount,
}: {
  year: string;
  isFinal: boolean;
  ready: boolean;
  blockedReason: string;
  warningCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const blocked = isFinal && !ready;
  const needsAck = isFinal && ready && warningCount > 0;
  const disabled = busy || blocked || (needsAck && !acknowledged);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          // Send what the user actually ticked, not a constant — so the flag
          // the endpoint checks means what it says.
          ...(isFinal ? { acknowledgeWarnings: acknowledged } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Generation failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          className="btn-primary"
          onClick={generate}
          disabled={disabled}
          title={
            blocked
              ? `Blocked: ${blockedReason}`
              : needsAck && !acknowledged
                ? 'Acknowledge the remaining warnings first'
                : undefined
          }
        >
          {busy
            ? 'Generating…'
            : isFinal
              ? 'Generate FINAL document'
              : 'Generate new draft'}
        </button>
        {blocked && (
          <span className="max-w-xs text-right text-xs text-slate-500">
            Blocked: {blockedReason}
          </span>
        )}
        {error && (
          <span className="max-w-xs text-right text-xs text-red-600">
            {error}
          </span>
        )}
      </div>

      {needsAck && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-left">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
          />
          <span className="text-xs text-slate-600">
            I have reviewed the {warningCount} remaining warning
            {warningCount === 1 ? '' : 's'} and accept them in the submitted
            document.
          </span>
        </label>
      )}
    </div>
  );
}
