import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Checking for password_hash column...');

    try {
        // Try to select the column to see if it exists
        await db.run(sql`SELECT password_hash FROM users LIMIT 1`);
        console.log('Column password_hash already exists.');
    } catch (e: any) {
        if (e.message.includes('no such column')) {
            console.log('Column missing. Adding password_hash...');
            await db.run(sql`ALTER TABLE users ADD COLUMN password_hash text`);
            console.log('Column added successfully.');
        } else {
            console.error('Unexpected error:', e);
        }
    }
}

main().catch(console.error);
