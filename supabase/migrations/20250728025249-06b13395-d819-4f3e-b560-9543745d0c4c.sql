-- Add comprehensive test data for Returns Portal testing with proper UUIDs

-- Insert test orders
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, created_at) VALUES
-- Tech/Electronics Orders
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ORD-2024-4001', 'alex.martinez@techstartup.com', 449.99, 'completed', '2025-07-20 14:30:00+00'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'ORD-2024-4002', 'jessica.brown@digitalagency.io', 299.97, 'completed', '2025-07-21 09:15:00+00'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'ORD-2024-4003', 'david.wilson@freelancer.net', 179.98, 'completed', '2025-07-22 16:45:00+00'),

-- Fashion/Lifestyle Orders  
('d4e5f6a7-b8c9-0123-defg-456789012345', 'ORD-2024-4004', 'emma.davis@fashion.com', 259.95, 'completed', '2025-07-23 11:20:00+00'),
('e5f6a7b8-c9d0-1234-efgh-567890123456', 'ORD-2024-4005', 'michael.thompson@outdoor.org', 389.99, 'completed', '2025-07-24 13:50:00+00'),

-- Home/Office Orders
('f6a7b8c9-d0e1-2345-fghi-678901234567', 'ORD-2024-4006', 'sarah.jones@homeoffice.co', 199.99, 'completed', '2025-07-25 10:30:00+00'),
('a7b8c9d0-e1f2-3456-ghij-789012345678', 'ORD-2024-4007', 'robert.garcia@consulting.biz', 89.97, 'completed', '2025-07-26 15:20:00+00'),

-- Higher value orders for testing
('b8c9d0e1-f2a3-4567-hijk-890123456789', 'ORD-2024-4008', 'lisa.wang@enterprise.com', 1299.99, 'completed', '2025-07-27 12:00:00+00'),
('c9d0e1f2-a3b4-5678-ijkl-901234567890', 'ORD-2024-4009', 'james.miller@startup.io', 599.98, 'completed', '2025-07-28 08:45:00+00');

-- Insert corresponding order items
INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, created_at) VALUES
-- ORD-2024-4001 items (Alex Martinez - Tech Startup)
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TECH-001', 'MacBook Pro 13" M2', 399.99, 1, '2025-07-20 14:30:00+00'),
('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TECH-002', 'Wireless Charging Pad', 49.99, 1, '2025-07-20 14:30:00+00'),

-- ORD-2024-4002 items (Jessica Brown - Digital Agency)
('33333333-3333-3333-3333-333333333333', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'TECH-003', 'iPad Air 64GB', 199.99, 1, '2025-07-21 09:15:00+00'),
('44444444-4444-4444-4444-444444444444', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'TECH-004', 'Apple Pencil', 99.99, 1, '2025-07-21 09:15:00+00'),

-- ORD-2024-4003 items (David Wilson - Freelancer)
('55555555-5555-5555-5555-555555555555', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'OFFICE-001', 'Ergonomic Keyboard', 89.99, 1, '2025-07-22 16:45:00+00'),
('66666666-6666-6666-6666-666666666666', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'OFFICE-002', 'Wireless Mouse', 89.99, 1, '2025-07-22 16:45:00+00'),

-- ORD-2024-4004 items (Emma Davis - Fashion)
('77777777-7777-7777-7777-777777777777', 'd4e5f6a7-b8c9-0123-defg-456789012345', 'FASHION-001', 'Designer Handbag', 199.95, 1, '2025-07-23 11:20:00+00'),
('88888888-8888-8888-8888-888888888888', 'd4e5f6a7-b8c9-0123-defg-456789012345', 'FASHION-002', 'Silk Scarf', 59.99, 1, '2025-07-23 11:20:00+00'),

-- ORD-2024-4005 items (Michael Thompson - Outdoor)
('99999999-9999-9999-9999-999999999999', 'e5f6a7b8-c9d0-1234-efgh-567890123456', 'OUTDOOR-001', 'Hiking Backpack 40L', 189.99, 1, '2025-07-24 13:50:00+00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e5f6a7b8-c9d0-1234-efgh-567890123456', 'OUTDOOR-002', 'Camping Tent 2-Person', 199.99, 1, '2025-07-24 13:50:00+00'),

-- ORD-2024-4006 items (Sarah Jones - Home Office)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f6a7b8c9-d0e1-2345-fghi-678901234567', 'HOME-001', 'Desk Organizer Set', 99.99, 1, '2025-07-25 10:30:00+00'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'f6a7b8c9-d0e1-2345-fghi-678901234567', 'HOME-002', 'LED Desk Lamp', 99.99, 1, '2025-07-25 10:30:00+00'),

-- ORD-2024-4007 items (Robert Garcia - Consulting)
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'a7b8c9d0-e1f2-3456-ghij-789012345678', 'BUSINESS-001', 'Business Card Holder', 29.99, 1, '2025-07-26 15:20:00+00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'a7b8c9d0-e1f2-3456-ghij-789012345678', 'BUSINESS-002', 'Professional Notebook', 19.99, 1, '2025-07-26 15:20:00+00'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'a7b8c9d0-e1f2-3456-ghij-789012345678', 'BUSINESS-003', 'Executive Pen Set', 39.99, 1, '2025-07-26 15:20:00+00'),

-- ORD-2024-4008 items (Lisa Wang - Enterprise - High Value)
('12345678-1234-1234-1234-123456789012', 'b8c9d0e1-f2a3-4567-hijk-890123456789', 'PREMIUM-001', 'MacBook Pro 16" M2 Max', 1199.99, 1, '2025-07-27 12:00:00+00'),
('23456789-2345-2345-2345-234567890123', 'b8c9d0e1-f2a3-4567-hijk-890123456789', 'PREMIUM-002', 'Premium Laptop Stand', 99.99, 1, '2025-07-27 12:00:00+00'),

-- ORD-2024-4009 items (James Miller - Startup)
('34567890-3456-3456-3456-345678901234', 'c9d0e1f2-a3b4-5678-ijkl-901234567890', 'TECH-005', 'Monitor 27" 4K', 299.99, 1, '2025-07-28 08:45:00+00'),
('45678901-4567-4567-4567-456789012345', 'c9d0e1f2-a3b4-5678-ijkl-901234567890', 'TECH-006', 'Mechanical Keyboard RGB', 149.99, 1, '2025-07-28 08:45:00+00'),
('56789012-5678-5678-5678-567890123456', 'c9d0e1f2-a3b4-5678-ijkl-901234567890', 'TECH-007', 'Gaming Mouse Pro', 149.99, 1, '2025-07-28 08:45:00+00');