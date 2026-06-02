-- Safe migration for sequential order numbers per store.
--
-- This script backfills `order_number`, adds a uniqueness safeguard,
-- and serializes new order number assignment using an advisory lock.
--
-- IMPORTANT: verify the current function owner in Supabase before applying.
-- In Supabase, SECURITY DEFINER functions execute with the privileges of
-- their owner. Prefer a minimum-privilege owner, or remove SECURITY DEFINER
-- only if RLS and permissions allow it.

BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at ASC) AS rn
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders
SET order_number = numbered.rn
FROM numbered
WHERE orders.id = numbered.id;

-- Add a unique index to enforce one order_number per store.
-- If this step fails, resolve duplicate store_id/order_number values first.
CREATE UNIQUE INDEX IF NOT EXISTS orders_store_order_number_unique_idx
  ON orders (store_id, order_number);

-- Create a trigger function that serializes assignment per store.
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.store_id::text)::bigint);

  SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_num
    FROM orders
    WHERE store_id = NEW.store_id;

  NEW.order_number := next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION set_order_number();

COMMIT;
