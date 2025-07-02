-- Add comprehensive test orders for customer portal testing

-- Order 1: ORD-2024-2004 (mike.chen@gmail.com) - The one from your screenshot
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('950e8400-e29b-41d4-a716-446655440000', 'ORD-2024-2004', 'mike.chen@gmail.com', 289.97, 'completed');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('950e8400-e29b-41d4-a716-446655440000', 'prod_006', 'Mechanical Keyboard', 149.99, 1),
('950e8400-e29b-41d4-a716-446655440000', 'prod_007', 'Gaming Mouse Pad', 29.99, 1),
('950e8400-e29b-41d4-a716-446655440000', 'prod_008', 'Wireless Charger', 109.99, 1);

-- Order 2: ORD-2024-1001 (emily.davis@company.com) - Additional test order
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('a50e8400-e29b-41d4-a716-446655440000', 'ORD-2024-1001', 'emily.davis@company.com', 199.98, 'completed');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('a50e8400-e29b-41d4-a716-446655440000', 'prod_009', 'Bluetooth Speaker', 79.99, 1),
('a50e8400-e29b-41d4-a716-446655440000', 'prod_010', 'Phone Case', 24.99, 1),
('a50e8400-e29b-41d4-a716-446655440000', 'prod_011', 'Screen Protector', 14.99, 2),
('a50e8400-e29b-41d4-a716-446655440000', 'prod_012', 'Car Mount', 79.99, 1);

-- Order 3: ORD-2024-1505 (john.smith@example.org) - Another test order
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('b50e8400-e29b-41d4-a716-446655440000', 'ORD-2024-1505', 'john.smith@example.org', 324.95, 'completed');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('b50e8400-e29b-41d4-a716-446655440000', 'prod_013', 'Laptop Stand', 89.99, 1),
('b50e8400-e29b-41d4-a716-446655440000', 'prod_014', 'External Monitor', 199.99, 1),
('b50e8400-e29b-41d4-a716-446655440000', 'prod_015', 'HDMI Cable', 19.99, 1),
('b50e8400-e29b-41d4-a716-446655440000', 'prod_016', 'Desk Organizer', 14.98, 1);

-- Order 4: ORD-2024-2020 (lisa.wong@startup.io) - Modern startup customer
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status) VALUES 
('c50e8400-e29b-41d4-a716-446655440000', 'ORD-2024-2020', 'lisa.wong@startup.io', 449.96, 'completed');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('c50e8400-e29b-41d4-a716-446655440000', 'prod_017', 'MacBook Pro Case', 79.99, 1),
('c50e8400-e29b-41d4-a716-446655440000', 'prod_018', 'Wireless Earbuds', 159.99, 1),
('c50e8400-e29b-41d4-a716-446655440000', 'prod_019', 'Portable SSD Drive', 189.99, 1),
('c50e8400-e29b-41d4-a716-446655440000', 'prod_020', 'USB Hub', 19.99, 1);

-- Create a sample merchant for return processing (needed for return submission)
INSERT INTO merchants (id, shop_domain, access_token, plan_type) VALUES 
('d50e8400-e29b-41d4-a716-446655440000', 'demo-store.myshopify.com', 'demo_access_token', 'pro')
ON CONFLICT (shop_domain) DO NOTHING;