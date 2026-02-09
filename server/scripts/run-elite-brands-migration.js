/**
 * Run elite brands migration manually (use when drizzle-kit push fails).
 * From server dir: node scripts/run-elite-brands-migration.js
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sovereign.sqlite');
const sqlPath = path.join(__dirname, '..', 'drizzle', '0004_elite_brands.sql');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found:', dbPath);
  process.exit(1);
}
if (!fs.existsSync(sqlPath)) {
  console.error('Migration file not found:', sqlPath);
  process.exit(1);
}

const db = new Database(dbPath);

// Run each statement separately so we can skip if table/column already exists
const sql = fs.readFileSync(sqlPath, 'utf8');
const statements = sql
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--'));

for (const stmt of statements) {
  if (!stmt) continue;
  try {
    db.exec(stmt + ';');
    console.log('OK:', stmt.slice(0, 50) + '...');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('Skip (already applied):', e.message);
    } else {
      console.error('Error:', e.message);
      process.exit(1);
    }
  }
}

db.close();
console.log('Elite brands migration done.');
