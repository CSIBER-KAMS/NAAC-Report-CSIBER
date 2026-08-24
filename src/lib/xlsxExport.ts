/**
 * NAAC data-template Excel export.
 *
 * Walks the full catalog (Extended Profile + Criteria I–VII) and produces
 * one worksheet per unique table `sheetRef`, mirroring the official NAAC
 * Data-Template-for-Autonomous workbook. Shared sheets (tables whose data
 * answers several metrics) are written once, by the owning metric.
 */

import ExcelJS from 'exceljs';
import { allCriteria } from '@/catalog';
import type { DataTable, Metric, TableColumn } from '@/catalog/types';
import { getTableRows } from '@/lib/db';

/** Excel sheet names may not contain \ / : * ? [ ] and max out at 31 chars. */
function sanitizeSheetName(sheetRef: string): string {
  const cleaned = sheetRef.replace(/[\\/:*?\[\]]/g, '').trim();
  const name = cleaned.slice(0, 31).trim();
  return name.length > 0 ? name : 'Sheet';
}

/** Ensure the (sanitized) name is unique within the workbook. */
function uniqueSheetName(base: string, used: Set<string>): string {
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${n})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

/** Coerce a stored cell value for a column into something Excel-friendly. */
function cellValue(
  column: TableColumn,
  raw: unknown
): string | number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (column.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
    return Number.isFinite(n) ? n : String(raw);
  }
  return typeof raw === 'string' ? raw : String(raw);
}

function addTableSheet(
  workbook: ExcelJS.Workbook,
  usedNames: Set<string>,
  yearId: number,
  metric: Metric,
  table: DataTable
): void {
  const sheetName = uniqueSheetName(
    sanitizeSheetName(table.sheetRef as string),
    usedNames
  );
  const sheet = workbook.addWorksheet(sheetName);

  const columns = table.columns;
  const colCount = Math.max(columns.length, 1);

  // Column widths: sensible fixed width, a little wider for long text.
  for (let i = 0; i < colCount; i++) {
    const col = sheet.getColumn(i + 1);
    const type = columns[i]?.type;
    col.width = type === 'longtext' ? 40 : 25;
  }

  // Row 1: caption "<metricId> <metric title>", merged across all columns.
  const caption = `${metric.id} ${metric.title}`;
  const captionRow = sheet.getRow(1);
  captionRow.getCell(1).value = caption;
  if (colCount > 1) {
    sheet.mergeCells(1, 1, 1, colCount);
  }
  captionRow.getCell(1).font = { bold: true };
  captionRow.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  captionRow.height = Math.min(
    75,
    Math.max(18, Math.ceil(caption.length / (colCount * 22)) * 15)
  );

  // Row 2: column labels, bold + wrapped.
  const headerRow = sheet.getRow(2);
  columns.forEach((column, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = column.label;
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, vertical: 'top' };
  });
  headerRow.height = 45;

  // Data rows in catalog column order.
  const dataRows = getTableRows(yearId, metric.id, table.key);

  if (table.mode === 'fixedRows' && table.fixedRows) {
    // First column is the fixed label; remaining cells come from stored data.
    table.fixedRows.forEach((label, i) => {
      const data = dataRows[i] ?? {};
      const row = sheet.getRow(3 + i);
      row.getCell(1).value = label;
      row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
      columns.slice(1).forEach((column, j) => {
        const cell = row.getCell(j + 2);
        cell.value = cellValue(column, data[column.key]);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });
  } else {
    dataRows.forEach((data, i) => {
      const row = sheet.getRow(3 + i);
      columns.forEach((column, j) => {
        const cell = row.getCell(j + 1);
        cell.value = cellValue(column, data[column.key]);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });
  }
  // Empty dynamic tables intentionally keep just the caption + header rows
  // so IQAC still sees the expected shape of every NAAC data template.
}

/**
 * Build the NAAC data-template workbook for one academic year.
 * One worksheet per unique table sheetRef, in catalog order
 * (Extended Profile first, then Criteria I–VII).
 */
export async function buildDataTemplates(yearId: number): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CSIBER AQAR System';
  workbook.created = new Date();

  const writtenSheetRefs = new Set<string>();
  const usedNames = new Set<string>();

  for (const criterion of allCriteria) {
    for (const keyIndicator of criterion.keyIndicators) {
      for (const metric of keyIndicator.metrics) {
        for (const table of metric.tables ?? []) {
          if (!table.sheetRef) continue;
          if (writtenSheetRefs.has(table.sheetRef)) continue; // shared sheet already written by its owning metric
          writtenSheetRefs.add(table.sheetRef);
          addTableSheet(workbook, usedNames, yearId, metric, table);
        }
      }
    }
  }

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(out)
    ? out
    : Buffer.from(out as unknown as ArrayBuffer);
}
