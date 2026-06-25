/**
 * Non-destructive SQLite migration: add users.clerk_user_id if missing.
 * Safe to run repeatedly. Does not replace `drizzle-kit push`.
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../sovereign.sqlite');

try {
    const db = new Database(dbPath);
    const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
    if (cols.includes('clerk_user_id')) {
        console.log('[migrate] users.clerk_user_id already exists');
        db.close();
        process.exit(0);
    }
    db.exec('ALTER TABLE users ADD COLUMN clerk_user_id TEXT');
    db.exec(
        'CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_uidx ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL'
    );
    console.log('[migrate] Added users.clerk_user_id + partial unique index');
    db.close();
} catch (e) {
    console.error('[migrate]', e.message);
    process.exit(1);
}
