-- Add sequential order_number per store
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Backfill existing orders ordered by creation date within each store
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

-- Function: assigns next sequential number scoped to store_id
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO NEW.order_number
  FROM orders
  WHERE store_id = NEW.store_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires only when order_number is not already set
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION set_order_number();
