-- Create orders table for customer portal functionality
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR DEFAULT 'completed'
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL,
  product_name VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public access policies for customer portal (no auth required)
CREATE POLICY "Public read access for orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public read access for order_items" ON order_items FOR SELECT USING (true);

-- Insert sample order data for testing
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('750e8400-e29b-41d4-a716-446655440000', '#ORD-2024-001', 'customer@example.com', 149.99, 'completed');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('750e8400-e29b-41d4-a716-446655440000', 'prod_001', 'Wireless Bluetooth Headphones', 129.99, 1),
('750e8400-e29b-41d4-a716-446655440000', 'prod_002', 'USB-C Cable', 19.99, 1);