/**

 * Non-destructive SQLite migration: promo_codes.shop_id and bookings.discount_code.

 * Safe to run repeatedly. Prefer `npm run push` after schema pulls for fresh clones.

 */

import Database from 'better-sqlite3';

import fs from 'fs';

import path from 'path';

import { fileURLToPath } from 'url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '../sovereign.sqlite');



try {

    if (!fs.existsSync(dbPath)) {

        console.log('[migrate] skip: sovereign.sqlite not found (nothing to ALTER)');

        process.exit(0);

    }



    const db = new Database(dbPath);



    const promoTable = db

        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='promo_codes'")

        .get();

    const bookingsTable = db

        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'")

        .get();

    if (!promoTable || !bookingsTable) {

        console.log('[migrate] skip: core tables missing (run npm run push in server/ first)');

        db.close();

        process.exit(0);

    }



    const promoCols = db.prepare('PRAGMA table_info(promo_codes)').all().map((c) => c.name);

    if (!promoCols.includes('shop_id')) {

        db.exec('ALTER TABLE promo_codes ADD COLUMN shop_id TEXT REFERENCES shops(id)');

        db.exec('CREATE INDEX IF NOT EXISTS promo_codes_shop_id_idx ON promo_codes (shop_id)');

        console.log('[migrate] Added promo_codes.shop_id');

    } else {

        console.log('[migrate] promo_codes.shop_id already exists');

    }



    const bookingCols = db.prepare('PRAGMA table_info(bookings)').all().map((c) => c.name);

    if (!bookingCols.includes('discount_code')) {

        db.exec('ALTER TABLE bookings ADD COLUMN discount_code TEXT');

        db.exec('CREATE INDEX IF NOT EXISTS bookings_discount_code_idx ON bookings (discount_code)');

        console.log('[migrate] Added bookings.discount_code');

    } else {

        console.log('[migrate] bookings.discount_code already exists');

    }



    db.close();

} catch (e) {

    console.error('[migrate]', e.message);

    process.exit(1);

}

