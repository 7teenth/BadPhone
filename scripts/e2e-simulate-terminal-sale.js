#!/usr/bin/env node
const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is required for E2E script');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log('Creating test store and user...');
    const storeRes = await client.query("INSERT INTO stores (name) VALUES ('E2E Test Store') RETURNING id");
    const storeId = storeRes.rows[0].id;

    const userRes = await client.query("INSERT INTO users (login, password_hash, name, role, store_id) VALUES ('e2e_user_'+gen_random_uuid()::text, 'e2ehash', 'E2E User', 'seller', $1) RETURNING id", [storeId]);
    const userId = userRes.rows[0].id;

    console.log('Creating visit...');
    const visitRes = await client.query(
      'INSERT INTO visits (title, sale_amount, store_id, seller_id, sale_id, created_at) VALUES ($1, $2, $3, $4, NULL, NOW()) RETURNING id',
      ['E2E Visit 1', 0, storeId, userId]
    );
    const visitId = visitRes.rows[0].id;

    console.log('Creating sale with payment_method terminal...');
    const saleRes = await client.query(
      `INSERT INTO sales (store_id, seller_id, receipt_number, total_amount, payment_method, items_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, payment_method`,
      [storeId, userId, 'E2E-RCPT-' + Date.now(), 123.45, 'terminal', JSON.stringify([])]
    );
    const saleId = saleRes.rows[0].id;
    const salePayment = saleRes.rows[0].payment_method;

    console.log('Linking sale to visit and writing payment_method to visit...');
    await client.query('UPDATE visits SET sale_id = $1, sale_amount = $2, payment_method = $3 WHERE id = $4', [saleId, 123.45, salePayment, visitId]);

    // Verify
    const visitCheck = await client.query('SELECT id, sale_amount, payment_method, sale_id FROM visits WHERE id = $1', [visitId]);
    const saleCheck = await client.query('SELECT id, payment_method FROM sales WHERE id = $1', [saleId]);

    console.log('Visit row:', visitCheck.rows[0]);
    console.log('Sale row:', saleCheck.rows[0]);

    if (visitCheck.rows[0].payment_method === 'terminal' && saleCheck.rows[0].payment_method === 'terminal') {
      console.log('\nE2E test success: both sale and visit recorded with payment_method=terminal');
    } else {
      console.error('\nE2E test failed: payment_method mismatch');
      process.exitCode = 2;
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await client.query('DELETE FROM visits WHERE id = $1', [visitId]);
    await client.query('DELETE FROM sales WHERE id = $1', [saleId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('DELETE FROM stores WHERE id = $1', [storeId]);

    console.log('Done');
  } catch (err) {
    console.error('E2E script failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
