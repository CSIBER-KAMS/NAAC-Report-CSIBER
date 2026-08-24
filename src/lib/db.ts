import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const GENERATED_DIR = path.join(DATA_DIR, 'generated');

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metric_values (
  year_id INTEGER NOT NULL REFERENCES years(id),
  metric_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty','in_progress','complete')),
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (year_id, metric_id)
);

CREATE TABLE IF NOT EXISTS table_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_id INTEGER NOT NULL REFERENCES years(id),
  metric_id TEXT NOT NULL,
  table_key TEXT NOT NULL DEFAULT 'main',
  row_index INTEGER NOT NULL,
  data TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_table_rows ON table_rows (year_id, metric_id, table_key, row_index);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_id INTEGER NOT NULL REFERENCES years(id),
  metric_id TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  orig_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  mime TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_evidence ON evidence (year_id, metric_id);

CREATE TABLE IF NOT EXISTS change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_id INTEGER NOT NULL REFERENCES years(id),
  metric_id TEXT,
  source TEXT,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolution_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_change_requests ON change_requests (year_id, status);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_id INTEGER NOT NULL REFERENCES years(id),
  version INTEGER NOT NULL,
  label TEXT,
  file_path TEXT NOT NULL,
  generated_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS part_a (
  year_id INTEGER PRIMARY KEY REFERENCES years(id),
  payload TEXT NOT NULL DEFAULT '{}',
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER,
  year_id INTEGER,
  metric_id TEXT,
  action TEXT NOT NULL,
  detail TEXT
);
`;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
    db = new Database(path.join(DATA_DIR, 'aqar.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA);
  }
  return db;
}

/* ---------------- convenience helpers ---------------- */

export interface YearRow {
  id: number;
  label: string;
  status: 'draft' | 'final';
}

export function getYearByLabel(label: string): YearRow | undefined {
  return getDb()
    .prepare('SELECT id, label, status FROM years WHERE label = ?')
    .get(label) as YearRow | undefined;
}

export function listYears(): YearRow[] {
  return getDb()
    .prepare('SELECT id, label, status FROM years ORDER BY label DESC')
    .all() as YearRow[];
}

export function getMetricPayload(yearId: number, metricId: string): {
  payload: Record<string, unknown>;
  status: string;
} {
  const row = getDb()
    .prepare(
      'SELECT payload, status FROM metric_values WHERE year_id = ? AND metric_id = ?'
    )
    .get(yearId, metricId) as { payload: string; status: string } | undefined;
  return {
    payload: row ? JSON.parse(row.payload) : {},
    status: row?.status ?? 'empty',
  };
}

export function getTableRows(
  yearId: number,
  metricId: string,
  tableKey: string
): Record<string, unknown>[] {
  const rows = getDb()
    .prepare(
      'SELECT data FROM table_rows WHERE year_id = ? AND metric_id = ? AND table_key = ? ORDER BY row_index'
    )
    .all(yearId, metricId, tableKey) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data));
}

/** metric_id -> slot_key -> uploaded file count, for one year. */
export function evidenceCountsForYear(
  yearId: number
): Record<string, Record<string, number>> {
  const rows = getDb()
    .prepare(
      'SELECT metric_id, slot_key, COUNT(*) as n FROM evidence WHERE year_id = ? GROUP BY metric_id, slot_key'
    )
    .all(yearId) as { metric_id: string; slot_key: string; n: number }[];
  const out: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    (out[r.metric_id] ??= {})[r.slot_key] = r.n;
  }
  return out;
}

export function logAudit(
  userId: number | null,
  yearId: number | null,
  metricId: string | null,
  action: string,
  detail?: unknown
) {
  getDb()
    .prepare(
      'INSERT INTO audit_log (user_id, year_id, metric_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    )
    .run(userId, yearId, metricId, action, detail ? JSON.stringify(detail) : null);
}
