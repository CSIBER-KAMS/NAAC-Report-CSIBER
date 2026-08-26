/**
 * Wipe all AQAR content, keeping the schema and the user accounts.
 *
 * Used to hand over a genuinely empty system after development and testing.
 * Deletes every metric value, table row, evidence record, change request,
 * generated document and academic year, plus the files on disk — but leaves
 * users, schools and criterion assignments alone.
 *
 *   npx tsx scripts/reset-data.ts --yes
 *   npx tsx scripts/reset-data.ts --yes --keep-years
 */
import fs from 'fs';
import path from 'path';
import { getDb, UPLOADS_DIR, GENERATED_DIR } from '../src/lib/db';

const args = process.argv.slice(2);
if (!args.includes('--yes')) {
  console.error(
    'Refusing to run without --yes.\n' +
      'This permanently deletes all AQAR data (metrics, evidence files,\n' +
      'generated documents and academic years). User accounts are kept.\n\n' +
      '  npx tsx scripts/reset-data.ts --yes'
  );
  process.exit(1);
}
const keepYears = args.includes('--keep-years');

const db = getDb();

const before = {
  metric_values: count('metric_values'),
  table_rows: count('table_rows'),
  evidence: count('evidence'),
  change_requests: count('change_requests'),
  generations: count('generations'),
  part_a: count('part_a'),
  years: count('years'),
  audit_log: count('audit_log'),
};

function count(table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number })
    .c;
}

// Order matters: everything below references years(id), so years go last.
db.transaction(() => {
  db.prepare('DELETE FROM change_requests').run();
  db.prepare('DELETE FROM table_rows').run();
  db.prepare('DELETE FROM metric_values').run();
  db.prepare('DELETE FROM part_a').run();
  db.prepare('DELETE FROM evidence').run();
  db.prepare('DELETE FROM generations').run();
  db.prepare('DELETE FROM audit_log').run();
  if (!keepYears) db.prepare('DELETE FROM years').run();
})();

/** Remove the contents of a directory, keeping the directory itself. */
function emptyDir(dir: string): number {
  const root = path.resolve(dir);
  if (!fs.existsSync(root)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(root)) {
    const target = path.resolve(path.join(root, entry));
    // Containment check, matching the evidence routes: never follow a path
    // that resolves outside the directory we were asked to clear.
    if (!target.startsWith(root + path.sep)) continue;
    fs.rmSync(target, { recursive: true, force: true });
    removed++;
  }
  return removed;
}

const removedUploads = emptyDir(UPLOADS_DIR);
const removedGenerated = emptyDir(GENERATED_DIR);

db.pragma('wal_checkpoint(TRUNCATE)');
db.exec('VACUUM');

console.log('Data reset complete.');
console.log('  deleted rows:');
for (const [table, n] of Object.entries(before)) {
  if (table === 'years' && keepYears) {
    console.log(`    ${table.padEnd(16)} ${n} (kept)`);
    continue;
  }
  console.log(`    ${table.padEnd(16)} ${n}`);
}
console.log(`  removed upload entries:    ${removedUploads}`);
console.log(`  removed generated entries: ${removedGenerated}`);
console.log(`  users kept:                ${count('users')}`);
console.log(`  schools kept:              ${count('schools')}`);
