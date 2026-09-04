/**
 * Readiness — "is this year fit to be submitted?", answered in one place.
 *
 * Every metric is already validated by `validateMetric`, but until now that
 * verdict only reached the Checklist page: generation never consulted it, so
 * a FINAL document could be produced with blank required cells and no one
 * would find out until a reviewer read the .docx. This module rolls those
 * per-metric issues up into a single year-level verdict, and BOTH the Generate
 * page and POST /api/generate read it — so what the screen shows and what the
 * endpoint enforces can never drift apart.
 *
 * Errors block the FINAL document. Warnings never block: they are the things
 * DVV will question, which the Head acknowledges rather than fixes.
 */
import { allCriteria, getMetric } from '@/catalog';
import type { IssueCode } from '@/catalog/types';
import { criterionProgress } from './derive';
import { evidenceCountsForYear, getDb } from './db';

/** One blocking error, carried with enough context to be actionable. */
export interface BlockingError {
  metricId: string;
  /** 0 = Extended Profile, 1-7 = criteria. */
  criterion: number;
  /** e.g. "Criterion 3 · Promotion of Research and Facilities". */
  context: string;
  message: string;
}

export interface WarningGroup {
  code: IssueCode;
  label: string;
  count: number;
}

export interface Readiness {
  errors: BlockingError[];
  errorCount: number;
  warningCount: number;
  /** Warnings bucketed by cause, largest first — the collapsed summary. */
  warningGroups: WarningGroup[];
  totalMetrics: number;
  complete: number;
  inProgress: number;
  notStarted: number;
  openChangeRequests: number;
  /** True when nothing blocks the FINAL document. */
  ready: boolean;
  /**
   * Why the FINAL document is blocked, as one sentence — empty when ready.
   * The API and the page both render this, so the reason a run was refused
   * always matches the reason the screen gave.
   */
  blockedReason: string;
}

/** Human label for each warning bucket, in the Head's vocabulary. */
const WARNING_LABEL: Record<IssueCode, string> = {
  word_limit: 'over the word limit',
  no_option: 'no option chosen',
  override_mismatch: 'manual value differs from the table',
  missing_evidence: 'missing required evidence',
  required_cell: 'blank required table cells',
};

function criterionContext(metricId: string): {
  criterion: number;
  context: string;
} {
  const found = getMetric(metricId);
  if (!found) return { criterion: -1, context: metricId };
  const { criterion, keyIndicator } = found;
  const name =
    criterion.number === 0
      ? 'Extended Profile'
      : `Criterion ${criterion.number}`;
  return {
    criterion: criterion.number,
    context: `${name} · ${keyIndicator.title}`,
  };
}

/**
 * Validate every metric in the year and roll the result up.
 *
 * This walks the whole catalog and hits the database per metric, exactly as
 * the dashboard and Checklist already do. Both call sites render on
 * `force-dynamic` pages, so there is nothing to cache against.
 */
export function computeReadiness(yearId: number): Readiness {
  const evidenceByMetric = evidenceCountsForYear(yearId);

  const errors: BlockingError[] = [];
  const warningsByCode = new Map<IssueCode, number>();
  let totalMetrics = 0;
  let complete = 0;
  let notStarted = 0;
  let warningCount = 0;

  for (const criterion of allCriteria) {
    for (const progress of criterionProgress(
      yearId,
      criterion,
      evidenceByMetric
    )) {
      totalMetrics += 1;
      if (progress.status === 'complete') complete += 1;
      if (!progress.hasData) notStarted += 1;

      for (const issue of progress.issues) {
        if (issue.severity === 'error') {
          errors.push({
            metricId: issue.metricId,
            ...criterionContext(issue.metricId),
            message: issue.message,
          });
        } else {
          warningCount += 1;
          warningsByCode.set(
            issue.code,
            (warningsByCode.get(issue.code) ?? 0) + 1
          );
        }
      }
    }
  }

  // Errors read in metric order (1.1.1 before 3.2.4) — the order someone
  // works through them, not the order the catalog happens to be built in.
  errors.sort((a, b) =>
    a.metricId.localeCompare(b.metricId, undefined, { numeric: true })
  );

  const warningGroups: WarningGroup[] = Array.from(warningsByCode.keys())
    .map((code) => ({
      code,
      label: WARNING_LABEL[code],
      count: warningsByCode.get(code) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const { openChangeRequests } = getDb()
    .prepare(
      "SELECT COUNT(*) AS openChangeRequests FROM change_requests WHERE year_id = ? AND status = 'open'"
    )
    .get(yearId) as { openChangeRequests: number };

  // Two things block the FINAL document, and the empty-metric one matters
  // most: validation only ever raises ERRORS for word limits, so without this
  // check a year in which nobody had entered anything at all would report
  // itself ready to submit.
  const blockers: string[] = [];
  if (errors.length > 0) {
    blockers.push(
      `${errors.length} validation error${errors.length === 1 ? '' : 's'}`
    );
  }
  if (notStarted > 0) {
    blockers.push(
      `${notStarted} metric${notStarted === 1 ? '' : 's'} with no data entered`
    );
  }

  return {
    errors,
    errorCount: errors.length,
    warningCount,
    warningGroups,
    totalMetrics,
    complete,
    inProgress: Math.max(totalMetrics - complete - notStarted, 0),
    notStarted,
    openChangeRequests,
    ready: blockers.length === 0,
    blockedReason: blockers.join(' and '),
  };
}
