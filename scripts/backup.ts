/**
 * Back up the entire system: the database plus every uploaded and generated
 * file.
 *
 *   npm run backup                    # → backups/<timestamp>/
 *   npm run backup -- /srv/aqar-backups
 *
 * Uses SQLite's online backup API rather than copying aqar.db, because the
 * database runs in WAL mode: a plain file copy can capture a torn state with
 * recent commits stranded in the -wal file. This produces a single consistent
 * file that can be opened directly.
 *
 * Written in Node so the host needs no sqlite3 CLI installed.
 */
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { UPLOADS_DIR, GENERATED_DIR } from '../src/lib/db';

const RETAIN_DAYS = 30;

const dataDir = process.env.AQAR_DATA_DIR
  ? path.resolve(process.env.AQAR_DATA_DIR)
  : path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'aqar.db');

const explicitRoot = process.argv[2];
const root = explicitRoot
  ? path.resolve(explicitRoot)
  : path.join(process.cwd(), 'backups');

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19);
const dest = path.join(root, stamp);

async function main() {
  if (!fs.existsSync(dbPath)) {
    console.error(`No database found at ${dbPath}`);
    process.exit(1);
  }

  fs.mkdirSync(dest, { recursive: true });

  const db = new Database(dbPath, { readonly: true });
  await db.backup(path.join(dest, 'aqar.db'));
  db.close();

  const dbSize = fs.statSync(path.join(dest, 'aqar.db')).size;
  console.log(`database  → aqar.db (${(dbSize / 1024).toFixed(0)} KB)`);

  let files = 0;
  for (const [label, src] of [
    ['uploads', UPLOADS_DIR],
    ['generated', GENERATED_DIR],
  ] as const) {
    if (!fs.existsSync(src)) continue;
    const target = path.join(dest, label);
    fs.cpSync(src, target, { recursive: true });
    files += countFiles(target);
    console.log(`${label.padEnd(9)} → ${label}/`);
  }
  console.log(`\nBackup complete: ${dest}`);
  console.log(`  ${files} file(s) copied.`);

  prune();
}

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(path.join(dir, entry.name));
    else n++;
  }
  return n;
}

/** Delete backup folders older than the retention window. */
function prune() {
  if (!fs.existsSync(root)) return;
  const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === stamp) continue;
    const full = path.join(root, entry.name);
    if (fs.statSync(full).mtimeMs < cutoff) {
      fs.rmSync(full, { recursive: true, force: true });
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`  pruned ${removed} backup(s) older than ${RETAIN_DAYS} days.`);
  }
}

main().catch((e) => {
  console.error('Backup failed:', e);
  process.exit(1);
});
