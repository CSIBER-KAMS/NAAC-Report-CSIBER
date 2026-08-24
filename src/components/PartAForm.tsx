'use client';

import { useState } from 'react';
import type { PartAField, PartASection } from '@/catalog/types';
import RowTable, { type Row } from '@/components/RowTable';

/** Whitespace-token word count (matches the server's countWords). */
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Part A payload shape stored in the `part_a` table:
 * { [sectionKey]: { [fieldKey]: string, _rows?: Row[] } }
 */
export type PartAValues = Record<string, Record<string, unknown>>;

function fieldValue(values: PartAValues, sectionKey: string, fieldKey: string) {
  const v = values[sectionKey]?.[fieldKey];
  return v === null || v === undefined ? '' : String(v);
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: PartAField;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case 'yesno':
      return (
        <select
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    case 'select':
      return (
        <select
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'longtext':
      return (
        <textarea
          rows={4}
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'url':
      return (
        <input
          type="text"
          placeholder="https://"
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function PartAForm({
  yearLabel,
  sections,
  initialPayload,
  readOnly = false,
}: {
  yearLabel: string;
  sections: PartASection[];
  initialPayload: PartAValues;
  readOnly?: boolean;
}) {
  const [values, setValues] = useState<PartAValues>(initialPayload ?? {});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(sectionKey: string, fieldKey: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [fieldKey]: value },
    }));
  }

  function setRows(sectionKey: string, rows: Row[]) {
    setValues((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), _rows: rows },
    }));
  }

  async function save() {
    setError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/part-a?year=${encodeURIComponent(yearLabel)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: values }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.key} className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            {section.title}
          </h2>
          {section.fields.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {section.fields.map((field) => {
                const value = fieldValue(values, section.key, field.key);
                const words = countWords(value);
                const over = !!field.wordLimit && words > field.wordLimit;
                const wide = field.type === 'longtext';
                return (
                  <div key={field.key} className={wide ? 'md:col-span-2' : ''}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="block text-xs font-medium text-slate-600">
                        {field.label}
                      </label>
                      {field.wordLimit && (
                        <span
                          className={`text-xs ${over ? 'font-semibold text-red-600' : 'text-slate-400'}`}
                        >
                          {words} / {field.wordLimit} words
                        </span>
                      )}
                    </div>
                    <FieldInput
                      field={field}
                      value={value}
                      disabled={readOnly}
                      onChange={(v) => setField(section.key, field.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {section.table && (
            <div className={section.fields.length > 0 ? 'mt-4' : ''}>
              <RowTable
                table={section.table}
                rows={(values[section.key]?._rows as Row[]) ?? []}
                readOnly={readOnly}
                onChange={(rows) => setRows(section.key, rows)}
              />
            </div>
          )}
        </div>
      ))}

      <div className="card flex items-center justify-end gap-3">
        {savedAt && !error && (
          <span className="text-xs text-green-700">Saved at {savedAt}</span>
        )}
        {error && (
          <span className="text-sm text-red-700">{error}</span>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={readOnly || saving}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save Part A'}
        </button>
      </div>
    </div>
  );
}
