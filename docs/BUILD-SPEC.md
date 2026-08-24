# CSIBER AQAR System — Build Specification

Internal tool for CSIBER's IQAC to collect NAAC AQAR data (Autonomous College
format), validate it, track evidence, run the faculty review loop, and generate
the AQAR document plus NAAC data-template Excel export. Schema-driven: all
metric definitions live in `src/catalog/` and drive forms, validation, the
generated document, and exports.

## Established stack and contracts (already written — do not modify)

- Next.js 14 App Router + TypeScript strict + Tailwind (classes `.input`,
  `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.badge` in
  `globals.css`).
- `src/catalog/types.ts` — the catalog type system. Read it before anything.
- `src/lib/db.ts` — better-sqlite3, schema, helpers (`getDb`, `getYearByLabel`,
  `listYears`, `getMetricPayload`, `getTableRows`, `evidenceCountsForYear`,
  `logAudit`, `UPLOADS_DIR`, `GENERATED_DIR`).
- `src/lib/auth.ts` — `currentUser()` (server), `authenticate`, `hashPassword`.
  `middleware.ts` already guards all routes; API handlers must still call
  `currentUser()` when they need the user id/role.
- `src/lib/derive.ts` — `countWords`, `evaluateDerivation`, `effectiveHeadline`,
  `validateMetric`, `criterionProgress`.
- `src/components/ui.tsx` — `PageHeader`, `Badge`, `StatusBadge`, `EmptyState`.
- `src/components/Sidebar.tsx` — navigation; authenticated pages render it via
  the `/y/[year]` layout.
- Catalog files `src/catalog/criterion{1..7}.ts`, `partA.ts`,
  `extendedProfile.ts`, merged in `src/catalog/index.ts`:
  `allCriteria: Criterion[]` (Extended Profile is number 0 first, then 1..7),
  `getCriterion(n)`, `getMetric(id)` -> `{ criterion, keyIndicator, metric }`,
  `partASections`.

## Conventions

- Year in URLs is the label, e.g. `/y/2025-26/...`; resolve with
  `getYearByLabel` and 404 (`notFound()`) when missing.
- All server pages: `export const dynamic = 'force-dynamic'`.
- When a year's status is `final`, every write API must reject with 409
  (admin year-reopen excepted).
- Every write API logs via `logAudit(userId, yearId, metricId, action, detail)`.
- JSON errors: `{ error: string }` with proper status codes.
- UI look: clean, dense, internal-tool aesthetic. Slate background, white
  cards, brand blue accents. No external assets or fonts.

## API surface

| Route | Methods | Behaviour |
|---|---|---|
| `/api/metric?year=&id=` | GET | `{ payload, status, rows: {tableKey: rows[]}, evidence: EvidenceRow[], derived: {value} }` |
| `/api/metric?year=&id=` | PUT | body `{ payload?, status? }` — upsert `metric_values` |
| `/api/rows?year=&metric=&table=` | PUT | body `{ rows: object[] }` — replace all rows (delete + insert in a transaction) |
| `/api/evidence` | POST | multipart form: `year`, `metric`, `slot`, `file` — store under `data/uploads/<year>/<metric>/<slot>/`, unique filename, insert row |
| `/api/evidence?year=&metric=` | GET | list rows |
| `/api/evidence/[id]` | DELETE | remove file + row |
| `/api/evidence/[id]/download` | GET | stream file with original name |
| `/api/part-a?year=` | GET/PUT | payload JSON for Part A |
| `/api/change-requests?year=` | GET/POST | POST body `{ metricId?, source?, note }` |
| `/api/change-requests/[id]` | PATCH | body `{ status: 'resolved', resolutionNote? }` |
| `/api/generate` | POST | body `{ year, label? }` — run docgen, insert `generations`, return `{ id, version }` |
| `/api/generations?year=` | GET | list versions |
| `/api/generations/[id]/download` | GET | stream the .docx |
| `/api/export-templates?year=` | GET | stream data-template .xlsx |
| `/api/admin/users` | GET/POST | admin only; POST `{ name, email, password, role }` |
| `/api/admin/users/[id]` | PATCH/DELETE | admin only; PATCH may reset password/role/name |
| `/api/admin/years` | GET/POST | admin only; POST `{ label }` (validate `NNNN-NN`) |
| `/api/admin/years/[id]` | PATCH | admin only; `{ status: 'final' | 'draft' }` |

## Pages (all under `src/app`)

- `/y/[year]/layout.tsx` — resolves year + `currentUser()`, renders `Sidebar`
  + `<main className="flex-1 overflow-y-auto p-6">{children}</main>` in a
  `flex h-screen` shell. Determines `active` nav key from the URL segment via
  a small client helper or per-page prop (keep simple: pass nothing and let
  Sidebar highlight by pathname with `usePathname` — Sidebar may be adapted
  to a client component if needed).
- `/y/[year]/page.tsx` — Dashboard: per-criterion progress cards (metrics
  complete / with data / total, error+warning counts from
  `criterionProgress`), open change-request count, latest generation, quick
  links.
- `/y/[year]/c/[n]/page.tsx` — criterion metric list grouped by Key Indicator:
  metric id, kind badge (QlM/QnM/Option), short title, `StatusBadge`, issue
  count, evidence count, link to metric page. n=0 renders Extended Profile.
- `/y/[year]/m/[id]/page.tsx` — metric detail (server) + `MetricForm` (client).
- `/y/[year]/part-a/page.tsx` — Part A form from `partASections` (client form,
  autosave-on-blur or explicit save via `/api/part-a`).
- `/y/[year]/review/page.tsx` — change-request queue: open list w/ metric
  links + resolve action; form to log a new request (metric select, source
  free text e.g. "Prof. X, Dept. Y", note); resolved history below.
- `/y/[year]/checklist/page.tsx` — Portal checklist: table of every metric
  (incl. EP): headline value (derived/manual), option choice, write-up word
  counts, evidence file count, URL fields, status, issues. Buttons: download
  latest AQAR docx, export data templates xlsx.
- `/y/[year]/generate/page.tsx` — generation history + "Generate new draft"
  (POST `/api/generate`, then refresh), download links, note that the year
  must be marked Final by admin for a final (non-draft-stamped) document.
- `/admin/page.tsx` — users table (add/reset password/deactivate via DELETE),
  years table (add year, mark final/reopen). Admin-only: check
  `currentUser()`, render "not authorised" card for staff.

## Client components (in `src/components/`)

- `MetricForm.tsx` — orchestrates one metric: prompt header, write-ups
  (textarea + live word count vs limit, red when over), option radio group,
  headline (derived read-only value + override number input + reason field),
  `RowTable` per catalog table, URL fields, `EvidencePanel`, status selector
  (Not started / In progress / Complete), change-request quick-log, save via
  PUT `/api/metric` + PUT `/api/rows`. Show validation issues returned from
  the API refresh.
- `RowTable.tsx` — editable grid for a `DataTable`: dynamic mode = add/remove
  rows; fixedRows mode = fixed first column labels; per-column input types
  (number/date/url/yesno/select/text/longtext); paste-friendly (textarea-like
  cells are fine, no need for spreadsheet paste parsing in v1).
- `EvidencePanel.tsx` — one card per evidence slot: uploaded files w/
  download/delete, file input + upload button, required badge.
- `PartAForm.tsx` — renders `partASections`.

## Document generation (`src/lib/docgen.ts`)

`generateAqar(yearId: number, opts: { draft: boolean; version: number }): Promise<Buffer>`
using the `docx` package. Layout per official AQAR format: A4, Times New
Roman 12pt body; heading hierarchy: title page ("The Annual Quality Assurance
Report (AQAR) of the IQAC", institution name from Part A, academic year),
Part A sections with field labels + values (tables where the section has one),
"Part B", then Extended Profile and Criteria I–VII: criterion heading, KI
headings ("Key Indicator – 1.1 …"), each metric: metric id + prompt
(bold), then its response: write-up paragraphs / chosen option (with the
option list shown and selection marked) / headline number line / data tables
rendered as bordered docx tables with header row / URL list / list of
uploaded evidence file names per slot. Empty metrics render "— Not filled —"
so gaps are visible in review. Footer on every page: "AQAR <year> — <DRAFT
v{version} | FINAL> — generated by CSIBER AQAR System" + page number.
Signature block at the end (Coordinator IQAC / Chairperson IQAC).
Keep the code organised: small builder functions per block type.

## Excel export (`src/lib/xlsxExport.ts`)

`buildDataTemplates(yearId: number): Promise<Buffer>` via `exceljs`: for every
catalog table with a `sheetRef`, one worksheet named by sheetRef (dedupe
shared sheets — write once), caption row(s) with the metric id + title, header
row from column labels (bold), then data rows in catalog column order.
Extended Profile sheets included. Sheet name must be a valid Excel name
(strip `\/:*?[]`, max 31 chars).

## Seeding (`scripts/seed.ts`)

Creates admin user (email `kams@siberindia.edu.in`, password `admin123`,
role admin), a staff user (`iqac@siberindia.edu.in` / `staff123`), and year
`2025-26`. Idempotent (INSERT OR IGNORE semantics).
