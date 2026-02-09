/**
 * Adds stripe_account_id and stripe_connect_status to users table if missing.
 * Run from server folder: node scripts/add-users-stripe-columns.mjs
 * Fixes 500 on signup when Drizzle selects from users and those columns don't exist.
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../sovereign.sqlite');
const db = new Database(dbPath);

const columns = [
  { name: 'stripe_account_id', sql: 'ALTER TABLE users ADD COLUMN stripe_account_id text' },
  { name: 'stripe_connect_status', sql: "ALTER TABLE users ADD COLUMN stripe_connect_status text DEFAULT 'unconnected'" }
];

const info = db.prepare('PRAGMA table_info(users)').all();
const existing = new Set(info.map((c) => c.name));

for (const { name, sql } of columns) {
  if (existing.has(name)) {
    console.log('Column users.' + name + ' already exists, skip');
  } else {
    db.exec(sql);
    console.log('Added users.' + name);
  }
}

db.close();
console.log('Done.');
