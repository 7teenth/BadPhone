import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = join(__dirname, '../database.db');
if (existsSync(dbPath)) {
  try {
    unlinkSync(dbPath);
    console.log('Existing database deleted.');
  } catch (err) {
    console.error('Error deleting existing database:', err.message);
    process.exit(1);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const schemaPath = join(__dirname, 'db_scheme.sql');
const seedPath = join(__dirname, 'seed.sql');

const runSQLFromFile = (filePath) => {
  const sql = readFileSync(filePath, 'utf8');
  db.exec(sql, (err) => {
    if (err) {
      console.error(`Error executing SQL from ${filePath}:`, err.message);
    }
  });
};

db.serialize(() => {
  try {
    runSQLFromFile(schemaPath);
    console.log('Database schema created.');
    runSQLFromFile(seedPath);
    console.log('Database seeded.');
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing the database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
});
