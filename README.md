# CSIBER AQAR System

Internal web application for CSIBER's IQAC to collect NAAC **Annual Quality
Assurance Report (AQAR)** data (Autonomous College format), validate it,
manage evidence files, run the faculty review loop, and generate the AQAR
document plus the NAAC data-template Excel workbook.

## How it works

- **Schema-driven.** Every NAAC metric (Extended Profile + Criteria I–VII,
  Part A) is defined once in `src/catalog/`, transcribed from the official
  NAAC templates. Entry forms, validation, the portal checklist, the
  generated AQAR document and the Excel export are all rendered from this
  catalog. When NAAC changes the format, update the catalog — not the app.
- **Data first, document second.** The generated AQAR is a read-only view of
  the database. Faculty review the generated draft; corrections are entered
  into the system (tracked as change requests) and the draft is regenerated.
  Never edit the generated document by hand.
- **DVV-proofing.** Where NAAC's own data templates link metrics (e.g. 1.3.3
  is the sum of a column in 1.3.2's table), the headline number is derived
  automatically; manual overrides require a reason and mismatches are
  flagged before submission.

## Running

```bash
npm install
npm run seed     # creates initial users + academic year
npm run dev      # http://localhost:3000
```

Default accounts (change the passwords after first login, in Administration):

| Role  | Email                    | Password |
|-------|--------------------------|----------|
| Admin | kams@siberindia.edu.in   | admin123 |
| Staff | iqac@siberindia.edu.in   | staff123 |

Production: `npm run build && npm start`. Set `AQAR_SECRET` in the
environment to a long random string.

## Storage

Everything lives in `data/` (gitignored): `aqar.db` (SQLite),
`uploads/<year>/<metric>/<slot>/` (evidence files), `generated/` (AQAR
versions). **Back up the `data/` folder** — a nightly copy of that one folder
is a complete backup of the system.

## Yearly workflow

1. Admin creates the academic year (Administration).
2. IQAC staff fill Part A, Extended Profile and Criteria 1–7; upload evidence
   per metric; mark metrics Complete.
3. Portal Checklist shows every metric's final value, word counts, evidence
   and open issues.
4. Generate AQAR draft → circulate to faculty → log change requests →
   correct data → regenerate.
5. Admin marks the year **Final**; generate the final document; key values
   into the NAAC portal using the checklist; export the data-template
   workbook for upload.

## Maintenance notes (for developers)

- Stack: Next.js 14 (App Router, TypeScript strict), better-sqlite3,
  Tailwind, `docx` (report), `exceljs` (data templates), JWT cookie auth.
- Catalog types: `src/catalog/types.ts`. Full build spec: `docs/BUILD-SPEC.md`.
- The database schema auto-creates on first run (`src/lib/db.ts`).
- To port to PostgreSQL later, replace `src/lib/db.ts` helpers; SQL is
  deliberately vanilla.
