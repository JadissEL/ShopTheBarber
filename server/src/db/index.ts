import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../sovereign.sqlite');
const sqlite = new Database(dbPath);
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
    process.stdout.write(`[DB] SQLite path: ${dbPath}\n`);
}
export const db = drizzle(sqlite, { schema });
