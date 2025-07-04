
-- Add the order that matches the search in the UI
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('960e8400-e29b-41d4-a716-446655440001', 'ORD-2024-2020', 'lisa.wong@startup.io', 399.97, 'completed')
ON CONFLICT (shopify_order_id) DO NOTHING;

-- Add some items for this order
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('960e8400-e29b-41d4-a716-446655440001', 'prod_012', 'Premium Laptop', 299.99, 1),
('960e8400-e29b-41d4-a716-446655440001', 'prod_013', 'Wireless Mouse', 49.99, 1),
('960e8400-e29b-41d4-a716-446655440001', 'prod_014', 'USB Cable', 49.99, 1)
ON CONFLICT DO NOTHING;
