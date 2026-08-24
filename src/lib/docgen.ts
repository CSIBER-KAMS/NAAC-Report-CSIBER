/**
 * AQAR document generation.
 *
 * Renders the full AQAR (Autonomous College format) for one academic year
 * as a .docx buffer using the `docx` package (v8 API). Layout: A4, Times
 * New Roman 12pt; title page, Part A (from the partASections catalog +
 * the part_a payload), then Part B — Extended Profile and Criteria I–VII
 * driven entirely by the metric catalog. Empty metrics render
 * "— Not filled —" so gaps stay visible during review.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type {
  Criterion,
  DataTable,
  EvidenceSlot,
  KeyIndicator,
  Metric,
  MetricPayload,
  PartASection,
} from '@/catalog/types';
import { allCriteria, partASections } from '@/catalog';
import { getDb, getMetricPayload, getTableRows } from '@/lib/db';
import { effectiveHeadline } from '@/lib/derive';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const FONT = 'Times New Roman';
const BODY_SIZE = 24; // half-points => 12pt

/** A4 page size in twips. */
const A4 = { width: 11906, height: 16838 };
const PAGE_MARGIN = { top: 1134, right: 1134, bottom: 1134, left: 1134 }; // ~2cm

const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' } as const;
const TABLE_BORDERS = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
  insideHorizontal: TABLE_BORDER,
  insideVertical: TABLE_BORDER,
};
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } as const;
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};
const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };

const KIND_LABEL: Record<Metric['kind'], string> = {
  qlm: 'QlM (Qualitative Metric)',
  qnm: 'QnM (Quantitative Metric)',
  option: 'Option (Opted / Not opted)',
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function isBlank(v: unknown): boolean {
  return fmtValue(v).trim() === '';
}

function para(text: string, opts: {
  bold?: boolean;
  italics?: boolean;
  size?: number;
  color?: string;
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  spacingBefore?: number;
  spacingAfter?: number;
  bullet?: boolean;
  pageBreakBefore?: boolean;
} = {}): Paragraph {
  return new Paragraph({
    alignment: opts.alignment,
    spacing: { before: opts.spacingBefore ?? 0, after: opts.spacingAfter ?? 80 },
    bullet: opts.bullet ? { level: 0 } : undefined,
    pageBreakBefore: opts.pageBreakBefore,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size,
        color: opts.color,
      }),
    ],
  });
}

/** "Label: value" line with a bold label. */
function labelValue(label: string, value: string, opts: { italicsValue?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value, italics: opts.italicsValue }),
    ],
  });
}

function tableCell(text: string, opts: { bold?: boolean; shaded?: boolean } = {}): TableCell {
  return new TableCell({
    margins: CELL_MARGINS,
    shading: opts.shaded ? { fill: 'E8EDF3' } : undefined,
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text, bold: opts.bold })],
      }),
    ],
  });
}

/**
 * Split a write-up into paragraphs on blank lines; single newlines inside a
 * chunk become soft line breaks.
 */
function writeupParagraphs(text: string): Paragraph[] {
  const chunks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c !== '');
  return chunks.map((chunk) => {
    const lines = chunk.split('\n');
    const runs: TextRun[] = [];
    lines.forEach((line, i) => {
      runs.push(new TextRun({ text: line, break: i > 0 ? 1 : undefined }));
    });
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
      children: runs,
    });
  });
}

/* ------------------------------------------------------------------ */
/* Data table rendering (shared by Part A and metrics)                 */
/* ------------------------------------------------------------------ */

/**
 * Render a catalog DataTable as a bordered docx table.
 * Returns [] when there are no rows (the table is skipped entirely).
 * fixedRows mode: the first cell of each row is the fixed label; the
 * remaining cells come from the stored row data in catalog column order.
 */
function buildDataTable(
  table: DataTable,
  rows: Record<string, unknown>[]
): (Paragraph | Table)[] {
  if (rows.length === 0) return [];

  const out: (Paragraph | Table)[] = [];
  if (table.title) {
    out.push(para(table.title, { bold: true, spacingBefore: 80, spacingAfter: 60 }));
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: table.columns.map((c) => tableCell(c.label, { bold: true, shaded: true })),
  });

  const bodyRows: TableRow[] = [];
  if (table.mode === 'fixedRows' && table.fixedRows) {
    table.fixedRows.forEach((fixedLabel, i) => {
      const data = rows[i] ?? {};
      const cells = table.columns.map((col, ci) =>
        ci === 0
          ? tableCell(fixedLabel, { bold: true })
          : tableCell(fmtValue(data[col.key]))
      );
      bodyRows.push(new TableRow({ children: cells }));
    });
  } else {
    for (const row of rows) {
      bodyRows.push(
        new TableRow({
          children: table.columns.map((col) => tableCell(fmtValue(row[col.key]))),
        })
      );
    }
  }

  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [headerRow, ...bodyRows],
    })
  );
  // Breathing room after the table.
  out.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  return out;
}

/* ------------------------------------------------------------------ */
/* Title page                                                          */
/* ------------------------------------------------------------------ */

function buildTitlePage(
  institutionName: string | null,
  yearLabel: string
): Paragraph[] {
  return [
    new Paragraph({ spacing: { after: 0 }, children: [] }),
    new Paragraph({ spacing: { after: 400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 400 },
      children: [
        new TextRun({
          text: institutionName ?? '(Institution name not entered in Part A)',
          bold: true,
          size: 36,
          italics: institutionName ? undefined : true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 300 },
      children: [
        new TextRun({
          text: 'The Annual Quality Assurance Report (AQAR) of the IQAC',
          bold: true,
          size: 32,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 200 },
      children: [new TextRun({ text: `Academic Year: ${yearLabel}`, bold: true, size: 28 })],
    }),
  ];
}

/* ------------------------------------------------------------------ */
/* Part A                                                              */
/* ------------------------------------------------------------------ */

function loadPartAPayload(yearId: number): Record<string, unknown> {
  const row = getDb()
    .prepare('SELECT payload FROM part_a WHERE year_id = ?')
    .get(yearId) as { payload: string } | undefined;
  try {
    return row ? (JSON.parse(row.payload) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * The Part A form stores everything scoped per section:
 * { [sectionKey]: { [fieldKey]: string, _rows?: Row[] } } (see PartAForm.tsx,
 * PartAValues). Field values and section table rows both live inside
 * payload[section.key], never at the payload's top level.
 */
function partASectionValues(
  payload: Record<string, unknown>,
  sectionKey: string
): Record<string, unknown> {
  const v = payload[sectionKey];
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/**
 * Locate the rows array a Part A section table was saved under. The primary
 * convention is payload[section.key]._rows; a few historical/alternate keys
 * are also accepted so the document degrades gracefully.
 */
function partATableRows(
  payload: Record<string, unknown>,
  section: PartASection
): Record<string, unknown>[] {
  const scoped = partASectionValues(payload, section.key);
  const candidates: unknown[] = [
    scoped['_rows'],
    scoped['rows'],
    payload[`${section.key}_table`],
    payload[`${section.key}__table`],
    payload[`${section.key}_rows`],
    (payload['tables'] as Record<string, unknown> | undefined)?.[section.key],
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c.filter(
        (r): r is Record<string, unknown> =>
          typeof r === 'object' && r !== null && !Array.isArray(r)
      );
    }
  }
  return [];
}

/**
 * Part A sections rendered as front matter. The closing "Plan of action for
 * the next academic year" section is excluded here: the official AQAR prints
 * it at the very end of the report, after Part B (see buildFuturePlans).
 */
const FUTURE_PLANS_KEY = 'futurePlans';

function buildPartA(yearId: number): (Paragraph | Table)[] {
  const payload = loadPartAPayload(yearId);
  const out: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Part A — Data of the Institution', bold: true })],
    }),
  ];

  for (const section of partASections.filter((s) => s.key !== FUTURE_PLANS_KEY)) {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: section.title, bold: true })],
      })
    );

    const scoped = partASectionValues(payload, section.key);
    for (const field of section.fields) {
      const v = scoped[field.key];
      out.push(labelValue(field.label, isBlank(v) ? '—' : fmtValue(v)));
    }

    if (section.table) {
      const rows = partATableRows(payload, section);
      out.push(...buildDataTable(section.table, rows));
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Metrics (Part B)                                                    */
/* ------------------------------------------------------------------ */

interface EvidenceFileRow {
  slot_key: string;
  orig_name: string;
}

function loadEvidence(yearId: number, metricId: string): EvidenceFileRow[] {
  return getDb()
    .prepare(
      'SELECT slot_key, orig_name FROM evidence WHERE year_id = ? AND metric_id = ? ORDER BY slot_key, id'
    )
    .all(yearId, metricId) as EvidenceFileRow[];
}

function buildOptionSelect(metric: Metric, payload: MetricPayload): Paragraph[] {
  const select = metric.optionSelect;
  if (!select) return [];
  const out: Paragraph[] = [];
  if (select.label) {
    out.push(para(select.label, { bold: true, spacingAfter: 60 }));
  }
  for (const option of select.options) {
    const chosen =
      (payload.optionChoice ?? '').trim().toLowerCase() === option.trim().toLowerCase();
    out.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: chosen ? '[X] ' : '[ ] ', bold: chosen }),
          new TextRun({ text: option, bold: chosen }),
        ],
      })
    );
  }
  return out;
}

function buildWriteups(metric: Metric, payload: MetricPayload): Paragraph[] {
  const writeups = metric.writeups ?? [];
  const multiple = writeups.length > 1;
  const out: Paragraph[] = [];
  for (const w of writeups) {
    const text = (payload.writeups?.[w.key] ?? '').trim();
    if (text === '') continue;
    if (multiple || w.label) {
      out.push(para(w.label ?? w.key, { bold: true, spacingBefore: 60, spacingAfter: 60 }));
    }
    out.push(...writeupParagraphs(text));
  }
  return out;
}

function buildEvidence(metric: Metric, files: EvidenceFileRow[]): Paragraph[] {
  const out: Paragraph[] = [];
  const slots: EvidenceSlot[] = metric.evidence ?? [];
  const bySlot = new Map<string, string[]>();
  for (const f of files) {
    const list = bySlot.get(f.slot_key) ?? [];
    list.push(f.orig_name);
    bySlot.set(f.slot_key, list);
  }

  if (files.length > 0) {
    out.push(para('Evidence uploaded:', { bold: true, spacingBefore: 60, spacingAfter: 40 }));
    const seen = new Set<string>();
    for (const slot of slots) {
      const names = bySlot.get(slot.key);
      seen.add(slot.key);
      if (!names || names.length === 0) continue;
      out.push(para(slot.label, { italics: true, spacingAfter: 20 }));
      for (const name of names) out.push(para(name, { bullet: true, spacingAfter: 20 }));
    }
    // Files whose slot no longer exists in the catalog.
    bySlot.forEach((names, slotKey) => {
      if (seen.has(slotKey)) return;
      out.push(para(slotKey, { italics: true, spacingAfter: 20 }));
      for (const name of names) out.push(para(name, { bullet: true, spacingAfter: 20 }));
    });
  }

  for (const slot of slots) {
    if (slot.required && !(bySlot.get(slot.key)?.length)) {
      out.push(
        para(`Required evidence "${slot.label}" has not been uploaded.`, {
          italics: true,
          spacingAfter: 40,
        })
      );
    }
  }
  return out;
}

function buildMetric(yearId: number, metric: Metric): (Paragraph | Table)[] {
  const { payload: rawPayload } = getMetricPayload(yearId, metric.id);
  const payload = rawPayload as MetricPayload;
  const tables = metric.tables ?? [];
  const rowsByTable = new Map<string, Record<string, unknown>[]>();
  for (const t of tables) {
    rowsByTable.set(t.key, getTableRows(yearId, metric.id, t.key));
  }
  const evidenceFiles = loadEvidence(yearId, metric.id);

  const out: (Paragraph | Table)[] = [];

  // Heading + kind badge.
  out.push(
    new Paragraph({
      spacing: { before: 240, after: 40 },
      keepNext: true,
      children: [new TextRun({ text: `${metric.id} — ${metric.title}`, bold: true })],
    })
  );
  out.push(para(KIND_LABEL[metric.kind], { italics: true, size: 20, color: '555555', spacingAfter: 80 }));

  // Does the metric have any data at all?
  const hasWriteup = Object.values(payload.writeups ?? {}).some((t) => String(t).trim() !== '');
  const hasRows = tables.some((t) => (rowsByTable.get(t.key) ?? []).length > 0);
  const hasUrls = Object.values(payload.urls ?? {}).some((u) => String(u).trim() !== '');
  // A derived headline evaluates to 0 over an empty source table, so a bare
  // derivation must not count as entered data — only an explicit override or
  // a derivation whose source table actually has rows does. Otherwise every
  // QnM metric would look "filled" and gaps would be invisible in review.
  const hasHeadlineValue = ((): boolean => {
    if (!metric.headline) return false;
    if (payload.headlineOverride !== undefined && payload.headlineOverride !== null) {
      return true;
    }
    const d = metric.headline.derive;
    if (!d) return false;
    return getTableRows(yearId, d.tableMetricId ?? metric.id, d.tableKey ?? 'main').length > 0;
  })();
  const hasData =
    hasWriteup ||
    hasRows ||
    hasUrls ||
    !!payload.optionChoice ||
    hasHeadlineValue ||
    evidenceFiles.length > 0;

  if (!hasData) {
    out.push(para('— Not filled —', { italics: true, spacingAfter: 120 }));
    return out;
  }

  // Write-ups.
  out.push(...buildWriteups(metric, payload));

  // Option metrics: full option list with the chosen one marked.
  out.push(...buildOptionSelect(metric, payload));

  // Headline number.
  if (metric.headline) {
    const value = effectiveHeadline(yearId, metric, payload);
    out.push(
      labelValue(
        metric.headline.label,
        value !== null ? String(value) : 'Not entered',
        { italicsValue: value === null }
      )
    );
  }

  // Data tables (skipped when empty).
  for (const t of tables) {
    out.push(...buildDataTable(t, rowsByTable.get(t.key) ?? []));
  }

  // URL fields.
  for (const u of metric.urls ?? []) {
    const v = (payload.urls?.[u.key] ?? '').trim();
    if (v !== '') out.push(labelValue(u.label, v));
  }

  // Evidence list + required-slot gaps.
  out.push(...buildEvidence(metric, evidenceFiles));

  return out;
}

function criterionHeadingText(criterion: Criterion): string {
  if (criterion.number === 0) return criterion.title;
  return `CRITERION ${ROMAN[criterion.number]} — ${criterion.title}`;
}

function keyIndicatorHeadingText(criterion: Criterion, ki: KeyIndicator): string {
  if (criterion.number === 0) return ki.title;
  return `Key Indicator – ${ki.code} ${ki.title}`;
}

function buildPartB(yearId: number): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Part B', bold: true })],
    }),
  ];

  for (const criterion of allCriteria) {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 160 },
        children: [new TextRun({ text: criterionHeadingText(criterion), bold: true })],
      })
    );
    for (const ki of criterion.keyIndicators) {
      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: keyIndicatorHeadingText(criterion, ki), bold: true })],
        })
      );
      for (const metric of ki.metrics) {
        out.push(...buildMetric(yearId, metric));
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Signature block and footer                                          */
/* ------------------------------------------------------------------ */

/** The closing "Plan of action for the next academic year" section, printed
 * after Part B and before the signature block per the official AQAR layout. */
function buildFuturePlans(yearId: number): (Paragraph | Table)[] {
  const section = partASections.find((s) => s.key === FUTURE_PLANS_KEY);
  if (!section) return [];
  const payload = loadPartAPayload(yearId);
  const out: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 200 },
      children: [new TextRun({ text: section.title, bold: true })],
    }),
  ];
  const scoped = partASectionValues(payload, section.key);
  for (const field of section.fields) {
    const v = scoped[field.key];
    out.push(labelValue(field.label, isBlank(v) ? '—' : fmtValue(v)));
  }
  if (section.table) {
    const rows = partATableRows(payload, section);
    out.push(...buildDataTable(section.table, rows));
  }
  return out;
}

function buildSignatureBlock(): (Paragraph | Table)[] {
  const signatureCell = (text: string, alignRight: boolean): TableCell =>
    new TableCell({
      borders: NO_BORDERS,
      margins: CELL_MARGINS,
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { before: 600, after: 40 },
          children: [new TextRun({ text: '____________________________' })],
        }),
        new Paragraph({
          alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { after: 0 },
          children: [new TextRun({ text, bold: true })],
        }),
      ],
    });

  return [
    new Paragraph({ spacing: { before: 480, after: 0 }, children: [] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            signatureCell('Signature of the Coordinator, IQAC', false),
            signatureCell('Signature of the Chairperson, IQAC', true),
          ],
        }),
      ],
    }),
  ];
}

function buildFooter(yearLabel: string, opts: { draft: boolean; version: number }): Footer {
  const stamp = opts.draft ? `DRAFT v${opts.version}` : 'FINAL';
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: `AQAR ${yearLabel} — ${stamp} — generated by CSIBER AQAR System — Page `,
            size: 18,
            color: '555555',
          }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '555555' }),
        ],
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function generateAqar(
  yearId: number,
  opts: { draft: boolean; version: number }
): Promise<Buffer> {
  const year = getDb()
    .prepare('SELECT id, label, status FROM years WHERE id = ?')
    .get(yearId) as { id: number; label: string; status: string } | undefined;
  if (!year) {
    throw new Error(`Unknown year id ${yearId}`);
  }

  const partAPayload = loadPartAPayload(yearId);
  const rawName = partASectionValues(partAPayload, 'institution')['institution_name'];
  const institutionName = isBlank(rawName) ? null : fmtValue(rawName).trim();

  const children: (Paragraph | Table)[] = [
    ...buildTitlePage(institutionName, year.label),
    ...buildPartA(yearId),
    ...buildPartB(yearId),
    ...buildFuturePlans(yearId),
    ...buildSignatureBlock(),
  ];

  const doc = new Document({
    creator: 'CSIBER AQAR System',
    title: `AQAR ${year.label}`,
    description: `Annual Quality Assurance Report for ${year.label}${opts.draft ? ` (draft v${opts.version})` : ' (final)'}`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
        },
        heading1: {
          run: { font: FONT, size: 32, bold: true, color: '000000' },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading2: {
          run: { font: FONT, size: 28, bold: true, color: '000000' },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        heading3: {
          run: { font: FONT, size: 24, bold: true, color: '000000' },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4.width, height: A4.height },
            margin: PAGE_MARGIN,
          },
        },
        footers: {
          default: buildFooter(year.label, opts),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
