
-- Add the specific order that the user is trying to look up
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('950e8400-e29b-41d4-a716-446655440000', 'ORD-2024-1505', 'john.smith@example.org', 299.97, 'completed')
ON CONFLICT (shopify_order_id) DO NOTHING;

-- Add some sample items for this order
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('950e8400-e29b-41d4-a716-446655440000', 'prod_006', 'Wireless Gaming Headset', 149.99, 1),
('950e8400-e29b-41d4-a716-446655440000', 'prod_007', 'Bluetooth Speaker', 89.99, 1),
('950e8400-e29b-41d4-a716-446655440000', 'prod_008', 'Phone Case', 59.99, 1)
ON CONFLICT DO NOTHING;

-- Add a few more test orders for better testing
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('960e8400-e29b-41d4-a716-446655440000', 'ORD-2024-1506', 'jane.doe@example.com', 199.98, 'completed'),
('970e8400-e29b-41d4-a716-446655440000', 'ORD-2024-1507', 'mike.wilson@example.net', 99.99, 'completed')
ON CONFLICT (shopify_order_id) DO NOTHING;

-- Add items for the additional test orders
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('960e8400-e29b-41d4-a716-446655440000', 'prod_009', 'Laptop Stand', 99.99, 1),
('960e8400-e29b-41d4-a716-446655440000', 'prod_010', 'Wireless Charger', 99.99, 1),
('970e8400-e29b-41d4-a716-446655440000', 'prod_011', 'Desk Organizer', 99.99, 1)
ON CONFLICT DO NOTHING;
