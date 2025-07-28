-- Add comprehensive test data for Returns Portal testing with proper UUIDs

-- Insert test orders
INSERT INTO orders (shopify_order_id, customer_email, total_amount, status, created_at) VALUES
-- Tech/Electronics Orders
('ORD-2024-4001', 'alex.martinez@techstartup.com', 449.99, 'completed', '2025-07-20 14:30:00+00'),
('ORD-2024-4002', 'jessica.brown@digitalagency.io', 299.97, 'completed', '2025-07-21 09:15:00+00'),
('ORD-2024-4003', 'david.wilson@freelancer.net', 179.98, 'completed', '2025-07-22 16:45:00+00'),

-- Fashion/Lifestyle Orders  
('ORD-2024-4004', 'emma.davis@fashion.com', 259.95, 'completed', '2025-07-23 11:20:00+00'),
('ORD-2024-4005', 'michael.thompson@outdoor.org', 389.99, 'completed', '2025-07-24 13:50:00+00'),

-- Home/Office Orders
('ORD-2024-4006', 'sarah.jones@homeoffice.co', 199.99, 'completed', '2025-07-25 10:30:00+00'),
('ORD-2024-4007', 'robert.garcia@consulting.biz', 89.97, 'completed', '2025-07-26 15:20:00+00'),

-- Higher value orders for testing
('ORD-2024-4008', 'lisa.wang@enterprise.com', 1299.99, 'completed', '2025-07-27 12:00:00+00'),
('ORD-2024-4009', 'james.miller@startup.io', 599.98, 'completed', '2025-07-28 08:45:00+00');