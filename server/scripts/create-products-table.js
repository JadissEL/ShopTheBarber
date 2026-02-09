/**
 * One-time script: create the products table if it doesn't exist.
 * Run from server dir: node scripts/create-products-table.js
 * (Or: npx tsx scripts/create-products-table.js if you use tsx)
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../sovereign.sqlite');
const db = new Database(dbPath);

const sql = `
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  description text,
  price real NOT NULL,
  image_url text,
  category text,
  seller_type text NOT NULL,
  barber_id text,
  shop_id text,
  vendor_name text,
  created_at text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barber_id) REFERENCES barbers(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);
`;

db.exec(sql);
console.log('Products table created or already exists.');
db.close();
