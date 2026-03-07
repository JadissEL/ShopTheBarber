import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { fileURLToPath } from 'url';

// Support both PostgreSQL (production) and SQLite (local dev fallback)
const databaseUrl = process.env.DATABASE_URL;

let db: any;

if (databaseUrl) {
    // PostgreSQL (Production)
    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
    });
    
    if (process.env.NODE_ENV !== 'test') {
        console.log('[DB] Using PostgreSQL');
    }
    
    db = drizzlePostgres(pool, { schema });
} else {
    // SQLite (Local Development Fallback)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, '../../sovereign.sqlite');
    
    const sqlite = new Database(dbPath);
    if (process.env.NODE_ENV !== 'test') {
        console.log(`[DB] Using SQLite: ${dbPath}`);
    }
    
    db = drizzleSqlite(sqlite, { schema });
}

export { db };
