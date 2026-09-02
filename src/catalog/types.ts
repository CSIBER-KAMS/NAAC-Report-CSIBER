/**
 * NAAC AQAR catalog type system (Autonomous College format).
 *
 * The entire application is schema-driven: entry forms, validation,
 * completeness tracking, the generated AQAR document and the NAAC
 * data-template Excel export are all rendered from this catalog.
 * Metric definitions are transcribed from the official NAAC criterion
 * templates and the Data-Template-for-Autonomous workbook.
 */

export type ColumnType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'date'
  | 'url'
  | 'yesno'
  | 'select';

export interface TableColumn {
  key: string; // snake_case identifier, unique within the table
  label: string; // exact NAAC column heading
  type: ColumnType;
  options?: string[]; // for type 'select'
  required?: boolean;
}

export interface DataTable {
  key: string; // unique within the metric, 'main' when there is only one
  title?: string; // sub-table caption when a metric has several tables
  mode: 'dynamic' | 'fixedRows';
  columns: TableColumn[];
  /**
   * For mode 'fixedRows': the predefined row labels (e.g. library resource
   * names, e-governance areas). The first column of each row is the label
   * and is not editable.
   */
  fixedRows?: string[];
  /** NAAC data-template sheet this table corresponds to, e.g. "1.3.2&1.3.3". */
  sheetRef?: string;
  /** Other metric ids whose answers are derived from this same table. */
  sharedWith?: string[];
  note?: string;
}

/** How a headline number is computed from entered table rows. */
export interface Derivation {
  /** Metric that owns the source table; defaults to the metric itself. */
  tableMetricId?: string;
  /** Key of the source table on that metric; defaults to 'main'. */
  tableKey?: string;
  expr: 'count' | 'sum' | 'countWhere';
  column?: string; // column key, required for 'sum'
  whereColumn?: string; // for 'countWhere'
  whereEquals?: string; // for 'countWhere' (case-insensitive compare)
}

export interface Headline {
  /** e.g. "Number of value-added courses offered during the year". */
  label: string;
  /**
   * When present the headline is auto-computed from table rows and shown
   * read-only; IQAC may override with a documented reason.
   */
  derive?: Derivation;
}

export interface Writeup {
  key: string; // 'main' when there is only one
  label?: string; // section heading for multi-part write-ups
  wordLimit?: number; // NAAC word limit, e.g. 200 or 500
}

export interface OptionSelect {
  label?: string;
  options: string[]; // exact NAAC option texts, in order
}

export interface EvidenceSlot {
  key: string; // snake_case identifier, unique within the metric
  label: string; // exact NAAC "File Description" item
  required?: boolean; // true for "Upload the data template" style items
}

export interface UrlField {
  key: string;
  label: string; // e.g. "Provide the URL for stakeholders' feedback report"
}

export type MetricKind = 'qlm' | 'qnm' | 'option';

export interface Metric {
  /** NAAC metric number, e.g. "1.1.1", or "EP-2.1" for Extended Profile. */
  id: string;
  kind: MetricKind;
  /** Full metric prompt text as printed in the NAAC template. */
  title: string;
  writeups?: Writeup[];
  headline?: Headline;
  tables?: DataTable[];
  optionSelect?: OptionSelect;
  urls?: UrlField[];
  evidence?: EvidenceSlot[];
  /** False where NAAC states "Data template is not applicable". */
  dataTemplateApplicable?: boolean;
  /** Mapping to the new 10-criteria NAAC framework, e.g. "C1 Curriculum Design (Input)". */
  newFrameworkMapping?: string;
  notes?: string;
}

export interface KeyIndicator {
  code: string; // "1.1"
  title: string; // "Curriculum Design and Development"
  metrics: Metric[];
}

export interface Criterion {
  number: number; // 1..7
  title: string; // "Curricular Aspects"
  keyIndicators: KeyIndicator[];
}

/* ------------------------------------------------------------------ */
/* Part A — Data of the Institution (from the NAAC AQAR guideline)     */
/* ------------------------------------------------------------------ */

export type PartAFieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'date'
  | 'url'
  | 'yesno'
  | 'select';

export interface PartAField {
  key: string;
  label: string;
  type: PartAFieldType;
  options?: string[];
  wordLimit?: number;
}

export interface PartASection {
  key: string;
  title: string; // numbered heading, e.g. "1. Name of the Institution"
  fields: PartAField[];
  /** Optional repeating table (e.g. IQAC meeting dates). */
  table?: DataTable;
}

/* ------------------------------------------------------------------ */
/* Runtime payloads stored in the database (JSON columns)              */
/* ------------------------------------------------------------------ */

export type MetricStatus = 'empty' | 'in_progress' | 'complete';

export interface MetricPayload {
  writeups?: Record<string, string>; // writeup key -> text
  headlineOverride?: number | null;
  headlineOverrideReason?: string;
  optionChoice?: string;
  urls?: Record<string, string>; // url field key -> value
  status?: MetricStatus;
}

/**
 * Why an issue was raised. Stable identifiers, so the readiness gate can
 * group and count warnings without parsing the human-readable message.
 */
export type IssueCode =
  | 'word_limit'
  | 'no_option'
  | 'override_mismatch'
  | 'missing_evidence'
  | 'required_cell';

export interface ValidationIssue {
  metricId: string;
  severity: 'error' | 'warning';
  code: IssueCode;
  message: string;
}
