/**
 * Schema migrations.
 *
 * The original design relied on `CREATE TABLE IF NOT EXISTS` alone, which
 * cannot alter an existing table — in particular SQLite cannot ALTER a CHECK
 * constraint, so widening `users.role` on a populated database requires a full
 * table rebuild. That is what this module exists for.
 *
 * RULES
 *  1. Migrations are FROZEN HISTORY. Never edit one that has shipped; add a
 *     new one instead.
 *  2. Migrations must NOT import moving constants (ROLES, catalog values, …).
 *     Every literal is written out so a migration means the same thing in five
 *     years as it did the day it was authored.
 *  3. Every migration must be idempotent in effect — `runMigrations` records
 *     what ran, but a guard inside each `up()` makes re-running harmless even
 *     if the ledger is lost.
 */
import type Database from 'better-sqlite3';

interface Migration {
  id: string;
  up(db: Database.Database): void;
}

const MIGRATIONS: Migration[] = [
  /* ------------------------------------------------------------------ */
  {
    // Schools must exist BEFORE the users rebuild, which references them.
    id: '001_schools_and_assignments',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schools (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          code TEXT,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS user_criteria (
          user_id INTEGER NOT NULL,
          criterion INTEGER NOT NULL CHECK (criterion BETWEEN 0 AND 7),
          PRIMARY KEY (user_id, criterion)
        );
      `);
    },
  },

  /* ------------------------------------------------------------------ */
  {
    /**
     * Widen users.role from ('admin','staff') to the four-role hierarchy and
     * add the approval-workflow columns. SQLite cannot ALTER a CHECK, so this
     * is the documented 12-step table rebuild.
     *
     * Legacy mapping: 'admin' stays admin; 'staff' becomes 'coordinator'
     * (least privilege — the seed step promotes the real Head explicitly).
     */
    id: '002_users_four_roles_and_approval',
    up(db) {
      const row = db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
        )
        .get() as { sql: string } | undefined;
      const alreadyRebuilt = Boolean(row && row.sql.includes('school_rep'));

      // The indexes are created at the END of this function in BOTH cases:
      // a fresh database gets its table shape from SCHEMA and skips the
      // rebuild, but still needs them. They cannot live in SCHEMA because
      // that block runs before migrations, when users.status may not exist.
      if (!alreadyRebuilt) {
        db.exec(`
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'coordinator'
            CHECK (role IN ('admin','iqac_head','coordinator','school_rep')),
          status TEXT NOT NULL DEFAULT 'active'
            CHECK (status IN ('pending','active','rejected','disabled')),
          school_id INTEGER REFERENCES schools(id),
          created_by INTEGER,
          approved_by INTEGER,
          approved_at TEXT,
          decision_note TEXT,
          token_valid_from TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO users_new (id, name, email, password_hash, role, status, created_at)
          SELECT id, name, email, password_hash,
                 CASE role WHEN 'admin' THEN 'admin' ELSE 'coordinator' END,
                 'active',
                 created_at
          FROM users;

        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        `);
      }

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_one_rep_per_school
          ON users(school_id)
          WHERE role = 'school_rep' AND status IN ('pending','active');
      `);
    },
  },

  /* ------------------------------------------------------------------ */
  {
    // School attribution for table rows, so a representative's contributions
    // can be separated from every other school's.
    id: '003_table_rows_school_columns',
    up(db) {
      const cols = db
        .prepare('PRAGMA table_info(table_rows)')
        .all() as { name: string }[];
      const names = new Set(cols.map((c) => c.name));
      if (!names.has('school_id')) {
        db.exec('ALTER TABLE table_rows ADD COLUMN school_id INTEGER');
      }
      if (!names.has('created_by')) {
        db.exec('ALTER TABLE table_rows ADD COLUMN created_by INTEGER');
      }
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_table_rows_school ON table_rows(year_id, metric_id, table_key, school_id)'
      );
    },
  },

  /* ------------------------------------------------------------------ */
  {
    /**
     * generations.file_path historically stored an ABSOLUTE path built on the
     * authoring machine (e.g. 'D:\NAAC-Report\data\generated\x.docx'). Those
     * rows resolve to nothing on a Linux server, so every existing generation
     * would fail to download. Store bare filenames and resolve against
     * GENERATED_DIR at read time, mirroring how evidence already works.
     */
    id: '004_generations_relative_paths',
    up(db) {
      const rows = db
        .prepare('SELECT id, file_path FROM generations')
        .all() as { id: number; file_path: string }[];
      const update = db.prepare(
        'UPDATE generations SET file_path = ? WHERE id = ?'
      );
      for (const r of rows) {
        if (!r.file_path) continue;
        // Split on BOTH separators: a Windows path must be parsed correctly
        // while running on Linux, which path.basename cannot do.
        const base = r.file_path.split(/[\\/]/).pop();
        if (base && base !== r.file_path) update.run(base, r.id);
      }
    },
  },

  /* ------------------------------------------------------------------ */
  {
    // Reviewing failed logins should be an indexed lookup, not a table scan.
    id: '005_audit_action_index',
    up(db) {
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_audit_action_at ON audit_log(action, at)'
      );
    },
  },
];

/**
 * Apply any migrations that have not run yet.
 *
 * Each runs in its own transaction so a failure leaves the database on the
 * last good migration rather than half-applied. Note that PRAGMA foreign_keys
 * cannot be toggled inside a transaction, so the caller manages it.
 */
export function runMigrations(db: Database.Database): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT id FROM schema_migrations').all() as { id: string }[]).map(
      (r) => r.id
    )
  );
  const record = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)');
  const ran: string[] = [];

  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;

    // Foreign keys must be off for the table-rebuild migrations, and the
    // pragma cannot be changed inside a transaction.
    const fkWasOn = db.pragma('foreign_keys', { simple: true }) === 1;
    if (fkWasOn) db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        m.up(db);
        const violations = db.pragma('foreign_key_check') as unknown[];
        if (violations.length > 0) {
          throw new Error(
            `Migration ${m.id} left ${violations.length} foreign key violation(s); rolled back.`
          );
        }
        record.run(m.id);
      })();
      ran.push(m.id);
    } finally {
      if (fkWasOn) db.pragma('foreign_keys = ON');
    }
  }

  return ran;
}
