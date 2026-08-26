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
npm run seed     # creates the two founding accounts
npm run dev      # http://localhost:3000
```

Seeding creates exactly two accounts and nothing else — no academic year, no
schools, no sample data:

| Role | Email |
|---|---|
| Administrator | kams@siberindia.edu.in |
| Head of IQAC | iqac@siberindia.edu.in |

Passwords are set by the operator via `SEED_ADMIN_PASSWORD` and
`SEED_HEAD_PASSWORD`, or fall back to the values in `scripts/seed.ts`.
**Change both in Administration once the system is reachable from the
internet.** Everyone else's account is created by the Administrator and
approved by the Head of IQAC.

Production: `npm run build && npm start`. `AQAR_SECRET` is **required** — the
application refuses to start without it, rather than silently signing sessions
with a guessable key. Put it in `.env.local` (gitignored) or the service
environment; generate one with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

For deployment on a college server, see **[docs/RUNBOOK.md](docs/RUNBOOK.md)**.

Don't run `npm run dev` and `npm run build`/`npm start` at the same time from
the same folder — both write to the `.next` build directory, and one
overwriting the other's files mid-request can produce a 500 error on some
pages. Stop the dev server before building for production (or vice versa).

## Storage

Everything lives in `data/` (gitignored): `aqar.db` (SQLite),
`uploads/<year>/<metric>/<slot>/` (evidence files), `generated/` (AQAR
versions). **Back up the `data/` folder** — a nightly copy of that one folder
is a complete backup of the system.

## Roles

Four levels, each with its own portal. Which one you get is decided by the
credentials you sign in with — never by whatever session the browser was
holding.

| Role | Scope |
|---|---|
| **Administrator** | Everything, plus accounts, schools and academic years |
| **Head of IQAC** | All AQAR data; approves accounts and assigns criteria; finalises the year; generates the FINAL document |
| **Criterion Coordinator** | Only the criteria assigned to them; generates drafts; resolves change requests on their criteria |
| **School Representative** | Contributes data and evidence for their own school only; raises change requests |

New accounts are created by the Administrator and stay **pending** until the
Head of IQAC approves them — so no single person can both create an identity
and authorise it.

## Yearly workflow

1. Head of IQAC creates the academic year (Administration).
2. Coordinators and School Representatives fill their assigned criteria;
   the Head fills Part A and the Extended Profile; evidence is uploaded per
   metric and metrics are marked Complete.
3. Portal Checklist shows every metric's final value, word counts, evidence
   and open issues.
4. Generate an AQAR draft → circulate for review → log change requests →
   correct the data → regenerate.
5. Head of IQAC marks the year **Final** and generates the final document; key
   the values into the NAAC portal using the checklist, and export the
   data-template workbook for upload.

## Maintenance notes (for developers)

- Stack: Next.js 14 (App Router, TypeScript strict), better-sqlite3,
  Tailwind, `docx` (report), `exceljs` (data templates), JWT cookie auth.
- Catalog types: `src/catalog/types.ts`. Full build spec: `docs/BUILD-SPEC.md`.
- The database schema auto-creates on first run (`src/lib/db.ts`).
- To port to PostgreSQL later, replace `src/lib/db.ts` helpers; SQL is
  deliberately vanilla.
