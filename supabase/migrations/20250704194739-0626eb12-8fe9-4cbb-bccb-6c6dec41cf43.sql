
-- First, let's clean up the mismatched data completely
DELETE FROM order_items WHERE order_id = 'c50e8400-e29b-41d4-a716-446655440000';
DELETE FROM orders WHERE shopify_order_id = 'ORD-2024-2020';

-- Now insert the correct order with matching ID
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('960e8400-e29b-41d4-a716-446655440001', 'ORD-2024-2020', 'lisa.wong@startup.io', 399.97, 'completed');

-- Insert order items with the CORRECT matching order_id
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('960e8400-e29b-41d4-a716-446655440001', 'prod_012', 'Premium Laptop', 299.99, 1),
('960e8400-e29b-41d4-a716-446655440001', 'prod_013', 'Wireless Mouse', 49.99, 1),
('960e8400-e29b-41d4-a716-446655440001', 'prod_014', 'USB Cable', 49.99, 1);
