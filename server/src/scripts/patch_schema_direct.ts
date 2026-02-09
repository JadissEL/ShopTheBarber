import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../sovereign.sqlite');
const db = new Database(dbPath);

console.log('Opening database at:', dbPath);

function addColumnIfNotExists(table: string, column: string, type: string) {
    try {
        db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get();
        console.log(`Column ${column} in ${table} already exists.`);
    } catch (err: any) {
        if (err.message.includes('no such column')) {
            console.log(`Adding ${column} column to ${table}...`);
            db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
            console.log('Done.');
        } else {
            console.error(`Error checking/adding column ${column}:`, err.message);
        }
    }
}

// Ensure password_hash exists (legacy check)
addColumnIfNotExists('users', 'password_hash', 'TEXT');

// Add Stripe columns
addColumnIfNotExists('users', 'stripe_account_id', 'TEXT');
addColumnIfNotExists('users', 'stripe_connect_status', "TEXT DEFAULT 'unconnected'");

db.close();
console.log('Migration complete.');
