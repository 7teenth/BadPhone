-- Add payment_method to visits table so we can track how a visit was paid
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Ensure only allowed values are stored (NULL allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visits_payment_method_check'
  ) THEN
    ALTER TABLE visits ADD CONSTRAINT visits_payment_method_check CHECK (payment_method IN ('cash', 'terminal'));
  END IF;
END$$;

-- Backfill existing demo rows if desired (optional)
-- UPDATE visits SET payment_method = 'cash' WHERE payment_method IS NULL;
