'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GenerateButton({ year }: { year: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
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
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn-primary"
        onClick={generate}
        disabled={busy}
      >
        {busy ? 'Generating…' : 'Generate new version'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
