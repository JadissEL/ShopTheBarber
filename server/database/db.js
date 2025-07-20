import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shopthebarber.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
    } else {
      console.log('Database schema initialized successfully');
      // Load seed data
      loadSeedData();
    }
  });
}

// Load seed data
function loadSeedData() {
  try {
    const seedPath = path.join(__dirname, 'seed-data.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    // Split into individual statements
    const statements = seed.split(';').filter(stmt => stmt.trim());
    
    let executedCount = 0;
    let errorCount = 0;
    
    statements.forEach((statement, index) => {
      if (statement.trim()) {
        db.run(statement.trim(), (err) => {
          if (err) {
            // Ignore constraint errors for existing data
            if (!err.message.includes('UNIQUE constraint failed')) {
              console.error(`Error executing statement ${index + 1}:`, err.message);
              errorCount++;
            }
          } else {
            executedCount++;
          }
        });
      }
    });
    
    // Wait a bit for all statements to execute
    setTimeout(() => {
      console.log(`Seed data loaded: ${executedCount} statements executed, ${errorCount} errors`);
    }, 1000);
    
  } catch (error) {
    console.error('Error loading seed data:', error.message);
  }
}

// Helper function to run queries with promises
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run single row queries
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to run insert/update/delete queries
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

export {
  db,
  query,
  get,
  run
}; 