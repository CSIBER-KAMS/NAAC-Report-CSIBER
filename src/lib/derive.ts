import type {
  Criterion,
  Derivation,
  Metric,
  MetricPayload,
  ValidationIssue,
} from '@/catalog/types';
import { getMetricPayload, getTableRows } from './db';

/** Count words the way NAAC reviewers do: whitespace-separated tokens. */
export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

/** Evaluate a headline derivation against stored table rows. */
export function evaluateDerivation(
  yearId: number,
  metric: Metric,
  derive: Derivation
): number {
  const metricId = derive.tableMetricId ?? metric.id;
  const tableKey = derive.tableKey ?? 'main';
  const rows = getTableRows(yearId, metricId, tableKey);
  switch (derive.expr) {
    case 'count':
      return rows.filter((r) =>
        Object.values(r).some((v) => String(v ?? '').trim() !== '')
      ).length;
    case 'sum':
      return rows.reduce(
        (acc, r) => acc + toNumber(derive.column ? r[derive.column] : 0),
        0
      );
    case 'countWhere':
      return rows.filter(
        (r) =>
          String(r[derive.whereColumn ?? ''] ?? '')
            .trim()
            .toLowerCase() ===
          String(derive.whereEquals ?? '').trim().toLowerCase()
      ).length;
    default:
      return 0;
  }
}

/** The value that will be printed in the report for a QnM headline. */
export function effectiveHeadline(
  yearId: number,
  metric: Metric,
  payload: MetricPayload
): number | null {
  if (payload.headlineOverride !== undefined && payload.headlineOverride !== null) {
    return payload.headlineOverride;
  }
  if (metric.headline?.derive) {
    return evaluateDerivation(yearId, metric, metric.headline.derive);
  }
  return null;
}

export interface EvidenceCount {
  [slotKey: string]: number;
}

/**
 * Flag blank required table cells. Skips tables with no rows yet — an
 * untouched table is already reported as "no data" elsewhere; this check is
 * only for rows someone has started filling in. Caps individual messages
 * per table so one badly-filled table doesn't drown out everything else.
 */
function validateTableRequiredColumns(
  yearId: number,
  metric: Metric,
  issues: ValidationIssue[]
): void {
  for (const table of metric.tables ?? []) {
    const requiredCols = table.columns.filter((c) => c.required);
    if (requiredCols.length === 0) continue;

    const rows = getTableRows(yearId, metric.id, table.key);
    if (rows.length === 0) continue;

    const label = table.title ? `'${table.title}'` : 'data';
    let gaps = 0;
    const MAX_ISSUES = 3;

    rows.forEach((row, idx) => {
      const rowLabel =
        table.mode === 'fixedRows' && table.fixedRows?.[idx]
          ? table.fixedRows[idx]
          : `Row ${idx + 1}`;
      for (const col of requiredCols) {
        const v = row[col.key];
        if (v === undefined || v === null || String(v).trim() === '') {
          gaps++;
          if (gaps <= MAX_ISSUES) {
            issues.push({
              metricId: metric.id,
              severity: 'warning',
              code: 'required_cell',
              message: `${rowLabel} of the ${label} table is missing '${col.label}'.`,
            });
          }
        }
      }
    });

    if (gaps > MAX_ISSUES) {
      issues.push({
        metricId: metric.id,
        severity: 'warning',
        code: 'required_cell',
        message: `${gaps - MAX_ISSUES} more required-field gap(s) in the ${label} table not shown.`,
      });
    }
  }
}

/**
 * Validate one metric: word limits, required evidence, override mismatches,
 * required table cells.
 * evidenceCounts maps slot_key -> number of uploaded files for this metric.
 */
export function validateMetric(
  yearId: number,
  metric: Metric,
  payload: MetricPayload,
  evidenceCounts: EvidenceCount
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const w of metric.writeups ?? []) {
    const text = payload.writeups?.[w.key] ?? '';
    if (w.wordLimit && countWords(text) > w.wordLimit) {
      issues.push({
        metricId: metric.id,
        severity: 'error',
        code: 'word_limit',
        message: `Write-up${w.label ? ` "${w.label}"` : ''} exceeds the ${w.wordLimit}-word limit (currently ${countWords(text)} words).`,
      });
    }
  }

  if (metric.optionSelect && !payload.optionChoice) {
    issues.push({
      metricId: metric.id,
      severity: 'warning',
      code: 'no_option',
      message: 'No option has been selected yet.',
    });
  }

  if (
    metric.headline?.derive &&
    payload.headlineOverride !== undefined &&
    payload.headlineOverride !== null
  ) {
    const derived = evaluateDerivation(yearId, metric, metric.headline.derive);
    if (derived !== payload.headlineOverride) {
      issues.push({
        metricId: metric.id,
        severity: 'warning',
        code: 'override_mismatch',
        message: `Manual value (${payload.headlineOverride}) differs from the value computed from the data table (${derived}).${payload.headlineOverrideReason ? '' : ' Add a reason for the override — DVV will question unexplained mismatches.'}`,
      });
    }
  }

  for (const slot of metric.evidence ?? []) {
    if (slot.required && !evidenceCounts[slot.key]) {
      issues.push({
        metricId: metric.id,
        severity: 'warning',
        code: 'missing_evidence',
        message: `Required evidence "${slot.label}" has not been uploaded.`,
      });
    }
  }

  validateTableRequiredColumns(yearId, metric, issues);

  return issues;
}

export interface MetricProgress {
  metricId: string;
  status: string;
  issues: ValidationIssue[];
  hasData: boolean;
}

/** Completeness summary of a criterion for the dashboard. */
export function criterionProgress(
  yearId: number,
  criterion: Criterion,
  evidenceByMetric: Record<string, EvidenceCount>
): MetricProgress[] {
  const out: MetricProgress[] = [];
  for (const ki of criterion.keyIndicators) {
    for (const metric of ki.metrics) {
      const { payload, status } = getMetricPayload(yearId, metric.id);
      const p = payload as MetricPayload;
      const issues = validateMetric(
        yearId,
        metric,
        p,
        evidenceByMetric[metric.id] ?? {}
      );
      const hasWriteup = Object.values(p.writeups ?? {}).some(
        (t) => String(t).trim() !== ''
      );
      const hasRows = (metric.tables ?? []).some(
        (t) => getTableRows(yearId, metric.id, t.key).length > 0
      );
      // A metric whose headline is derived from another metric's table (e.g.
      // 1.3.3 sums a column of 1.3.2's table) owns no table/writeup of its
      // own, but genuinely has data once that source table has rows —
      // otherwise it would misreport as empty even though it carries a real
      // computed value in the generated report.
      const derive = metric.headline?.derive;
      const hasDerivedSourceRows = derive
        ? getTableRows(
            yearId,
            derive.tableMetricId ?? metric.id,
            derive.tableKey ?? 'main'
          ).length > 0
        : false;
      const hasData =
        hasWriteup ||
        hasRows ||
        hasDerivedSourceRows ||
        !!p.optionChoice ||
        (p.headlineOverride !== undefined && p.headlineOverride !== null);
      out.push({ metricId: metric.id, status, issues, hasData });
    }
  }
  return out;
}
