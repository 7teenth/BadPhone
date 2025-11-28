#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required to run migrations');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();

    const scriptsDir = path.join(__dirname);
    const files = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No .sql files found in scripts/');
      return;
    }

    for (const file of files) {
      const fullPath = path.join(scriptsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8').trim();
      if (!sql) continue;

      console.log(`\n--- Running ${file} ---`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✔ ${file} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✖ Failed to apply ${file}:`, err.message || err);
        throw err;
      }
    }

    console.log('\nAll migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
