-- Safe migration: move order_number assignment to application layer.
-- This prevents number consumption if order creation fails.

BEGIN;

-- Create a sequences table to track the next order number per store
CREATE TABLE IF NOT EXISTS order_number_sequences (
  store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  next_order_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Backfill existing stores with their sequence starting at max(order_number) + 1
INSERT INTO order_number_sequences (store_id, next_order_number)
SELECT s.id, COALESCE(MAX(o.order_number), 0) + 1
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id
GROUP BY s.id
ON CONFLICT (store_id) DO NOTHING;

-- Create a function to atomically get and increment the next order number for a store.
-- Returns the order_number to use for the new order.
CREATE OR REPLACE FUNCTION get_next_order_number(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_order_number INTEGER;
BEGIN
  UPDATE order_number_sequences
  SET next_order_number = next_order_number + 1,
      updated_at = NOW()
  WHERE store_id = p_store_id
  RETURNING next_order_number - 1 INTO v_order_number;

  IF v_order_number IS NULL THEN
    -- If store doesn't have a sequence yet, create one
    INSERT INTO order_number_sequences (store_id, next_order_number)
    VALUES (p_store_id, 2)
    ON CONFLICT (store_id) DO UPDATE
      SET next_order_number = next_order_number + 1
    RETURNING next_order_number - 1 INTO v_order_number;
  END IF;

  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANT: Remove the old trigger since we now assign order_number from the application
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;

-- Optional: keep the function for backwards compatibility, but it's no longer used
-- You can drop it if you prefer: DROP FUNCTION IF EXISTS set_order_number();

COMMIT;
