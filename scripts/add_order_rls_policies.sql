-- Enable RLS on orders and order_items tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy for orders: Allow insert for service role (API)
CREATE POLICY "Allow service role to insert orders" ON orders
FOR INSERT TO service_role
WITH CHECK (true);

-- Policy for orders: Allow select for service role (API)
CREATE POLICY "Allow service role to select orders" ON orders
FOR SELECT TO service_role
USING (true);

-- Policy for orders: Allow update for service role (API)
CREATE POLICY "Allow service role to update orders" ON orders
FOR UPDATE TO service_role
USING (true);

-- Policy for order_items: Allow insert for service role (API)
CREATE POLICY "Allow service role to insert order_items" ON order_items
FOR INSERT TO service_role
WITH CHECK (true);

-- Policy for order_items: Allow select for service role (API)
CREATE POLICY "Allow service role to select order_items" ON order_items
FOR SELECT TO service_role
USING (true);

-- Policy for order_items: Allow update for service role (API)
CREATE POLICY "Allow service role to update order_items" ON order_items
FOR UPDATE TO service_role
USING (true);

-- Policy for orders: Allow store owners to view their orders
CREATE POLICY "Store owners can view their orders" ON orders
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Policy for order_items: Allow store owners to view their order items
CREATE POLICY "Store owners can view their order items" ON order_items
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders WHERE store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  )
);
