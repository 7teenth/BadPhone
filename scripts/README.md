## Migration and E2E helper scripts

These scripts help running SQL migrations and a simple E2E positive test that simulates a terminal sale.

1. Run migrations

Ensure DATABASE_URL env var is set then run:

```bash
npm run migrate
```

This will run all .sql files in the scripts/ directory in lexicographic order.

2. E2E simulation (local DB only)

Set DATABASE_URL and run:

```bash
npm run e2e:terminal-sale
```

This will create a temporary store/user/visit/sale (with payment_method = 'terminal'), link them, verify the rows, then clean up.

NOTE: These scripts run SQL against the database specified in DATABASE_URL and will create/delete rows for the test. Use a test or local database.
