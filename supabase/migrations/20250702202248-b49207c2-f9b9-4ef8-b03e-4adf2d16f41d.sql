-- Insert sample data for testing the customer portal
-- Sample merchant
INSERT INTO merchants (id, shop_domain, access_token, plan_type) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'demo-store.myshopify.com', 'test_token_123', 'pro');

-- Sample return with items
INSERT INTO returns (id, shopify_order_id, customer_email, reason, status, total_amount, merchant_id) VALUES 
('650e8400-e29b-41d4-a716-446655440000', '#ORD-2024-001', 'customer@example.com', 'Wrong size', 'requested', 149.99, '550e8400-e29b-41d4-a716-446655440000');

-- Sample return items
INSERT INTO return_items (return_id, product_id, product_name, price, quantity, action) VALUES 
('650e8400-e29b-41d4-a716-446655440000', 'prod_001', 'Wireless Bluetooth Headphones', 129.99, 1, 'refund'),
('650e8400-e29b-41d4-a716-446655440000', 'prod_002', 'USB-C Cable', 19.99, 1, 'refund');