'use client';

import type { DataTable, TableColumn } from '@/catalog/types';

export type Row = Record<string, unknown>;

function cellString(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

const CELL_WIDTH: Record<string, string> = {
  number: 'min-w-[7rem]',
  date: 'min-w-[9.5rem]',
  yesno: 'min-w-[6.5rem]',
  select: 'min-w-[9rem]',
  longtext: 'min-w-[18rem]',
  url: 'min-w-[14rem]',
  text: 'min-w-[10rem]',
};

function CellInput({
  column,
  value,
  onChange,
  disabled,
}: {
  column: TableColumn;
  value: unknown;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const v = cellString(value);
  const cls = 'input px-2 py-1';
  switch (column.type) {
    case 'yesno':
      return (
        <select
          className={cls}
          value={v}
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
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {(column.options ?? []).map((o) => (
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
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'longtext':
      return (
        <textarea
          rows={2}
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'url':
      return (
        <input
          type="text"
          placeholder="https://"
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          className={cls}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * Editable grid for one catalog DataTable.
 * dynamic mode: add/remove rows; fixedRows mode: fixed first-column labels.
 */
export default function RowTable({
  table,
  rows,
  onChange,
  readOnly = false,
}: {
  table: DataTable;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  readOnly?: boolean;
}) {
  const isFixed = table.mode === 'fixedRows';
  const fixedRows = table.fixedRows ?? [];
  const firstKey = table.columns[0]?.key ?? '';

  const displayRows: Row[] = isFixed
    ? fixedRows.map((label, i) => ({ ...(rows[i] ?? {}), [firstKey]: label }))
    : rows;

  function setCell(rowIndex: number, key: string, value: string) {
    onChange(
      displayRows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r))
    );
  }

  function addRow() {
    onChange([...displayRows, {}]);
  }

  function removeRow(rowIndex: number) {
    onChange(displayRows.filter((_, i) => i !== rowIndex));
  }

  return (
    <div>
      {table.note && (
        <p className="mb-2 text-xs text-slate-500">{table.note}</p>
      )}
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {table.columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-normal border-b border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600"
                >
                  {c.label}
                  {c.required && <span className="text-red-600"> *</span>}
                </th>
              ))}
              {!isFixed && !readOnly && (
                <th className="w-10 border-b border-slate-200" />
              )}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 && (
              <tr>
                <td
                  colSpan={table.columns.length + (!isFixed && !readOnly ? 1 : 0)}
                  className="px-3 py-4 text-center text-xs text-slate-400"
                >
                  No rows entered yet.
                </td>
              </tr>
            )}
            {displayRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-b-0">
                {table.columns.map((c, ci) => (
                  <td
                    key={c.key}
                    className={`px-1.5 py-1.5 align-top ${CELL_WIDTH[c.type] ?? ''}`}
                  >
                    {isFixed && ci === 0 ? (
                      <span className="block px-2 py-1 text-sm font-medium text-slate-700">
                        {cellString(row[c.key])}
                      </span>
                    ) : (
                      <CellInput
                        column={c}
                        value={row[c.key]}
                        disabled={readOnly}
                        onChange={(v) => setCell(i, c.key, v)}
                      />
                    )}
                  </td>
                ))}
                {!isFixed && !readOnly && (
                  <td className="px-1.5 py-1.5 align-top">
                    <button
                      type="button"
                      title="Remove row"
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => removeRow(i)}
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isFixed && !readOnly && (
        <button
          type="button"
          className="btn-secondary mt-2 px-3 py-1.5 text-xs"
          onClick={addRow}
        >
          + Add row
        </button>
      )}
    </div>
  );
}
