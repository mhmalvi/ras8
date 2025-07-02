-- Add the test order that was shown in the screenshot
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('850e8400-e29b-41d4-a716-446655440000', 'ORD-2024-3008', 'sarah.johnson@email.com', 173.94, 'completed');

-- Add some sample items for this order
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('850e8400-e29b-41d4-a716-446655440000', 'prod_003', 'Premium Wireless Mouse', 89.99, 1),
('850e8400-e29b-41d4-a716-446655440000', 'prod_004', 'USB-C Hub', 49.99, 1),
('850e8400-e29b-41d4-a716-446655440000', 'prod_005', 'Phone Stand', 33.96, 1);