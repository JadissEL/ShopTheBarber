/**
 * Applies migration SQL so the test DB has the full schema (including
 * google_calendar_refresh_token). Runs before all tests so CI passes
 * even if drizzle-kit push didn't run or used a stale cache.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../sovereign.sqlite');
const drizzleDir = path.resolve(__dirname, '../../drizzle');

function runMigrations(db: Database.Database) {
    const files = fs.readdirSync(drizzleDir)
        .filter((f) => f.endsWith('.sql') && /^\d+_/.test(f))
        .sort();
    for (const file of files) {
        const content = fs.readFileSync(path.join(drizzleDir, file), 'utf8');
        const statements = content
            .split(/\n\s*--> statement-breakpoint\s*\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        for (let stmt of statements) {
            stmt = stmt.trim();
            if (!stmt) continue;
            // One chunk may contain multiple statements (e.g. 0008)
            const parts = stmt.split(';').map((p) => p.trim()).filter(Boolean);
            for (const p of parts) {
                try {
                    db.exec(p + ';');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    if (msg.includes('duplicate column name') || msg.includes('already exists')) continue;
                    throw e;
                }
            }
        }
    }
}

/** Run in same process as tests so CI always sees the migrated DB. Call from test beforeAll. */
export function ensureMigrations() {
    const db = new Database(dbPath);
    try {
        runMigrations(db);
    } finally {
        db.close();
    }
}

export default function globalSetup() {
    ensureMigrations();
}
