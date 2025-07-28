-- Add comprehensive test data for Returns Portal testing

-- Insert test orders
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, created_at) VALUES
-- Tech/Electronics Orders
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ORD-2024-4001', 'alex.martinez@techstartup.com', 449.99, 'completed', '2025-07-20 14:30:00+00'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'ORD-2024-4002', 'jessica.brown@digitalagency.io', 299.97, 'completed', '2025-07-21 09:15:00+00'),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'ORD-2024-4003', 'david.wilson@freelancer.net', 179.98, 'completed', '2025-07-22 16:45:00+00'),

-- Fashion/Lifestyle Orders  
('d4e5f6g7-h8i9-0123-defg-456789012345', 'ORD-2024-4004', 'emma.davis@fashion.com', 259.95, 'completed', '2025-07-23 11:20:00+00'),
('e5f6g7h8-i9j0-1234-efgh-567890123456', 'ORD-2024-4005', 'michael.thompson@outdoor.org', 389.99, 'completed', '2025-07-24 13:50:00+00'),

-- Home/Office Orders
('f6g7h8i9-j0k1-2345-fghi-678901234567', 'ORD-2024-4006', 'sarah.jones@homeoffice.co', 199.99, 'completed', '2025-07-25 10:30:00+00'),
('g7h8i9j0-k1l2-3456-ghij-789012345678', 'ORD-2024-4007', 'robert.garcia@consulting.biz', 89.97, 'completed', '2025-07-26 15:20:00+00'),

-- Higher value orders for testing
('h8i9j0k1-l2m3-4567-hijk-890123456789', 'ORD-2024-4008', 'lisa.wang@enterprise.com', 1299.99, 'completed', '2025-07-27 12:00:00+00'),
('i9j0k1l2-m3n4-5678-ijkl-901234567890', 'ORD-2024-4009', 'james.miller@startup.io', 599.98, 'completed', '2025-07-28 08:45:00+00');

-- Insert corresponding order items
INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, created_at) VALUES
-- ORD-2024-4001 items (Alex Martinez - Tech Startup)
('item-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TECH-001', 'MacBook Pro 13" M2', 399.99, 1, '2025-07-20 14:30:00+00'),
('item-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TECH-002', 'Wireless Charging Pad', 49.99, 1, '2025-07-20 14:30:00+00'),

-- ORD-2024-4002 items (Jessica Brown - Digital Agency)
('item-003', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'TECH-003', 'iPad Air 64GB', 199.99, 1, '2025-07-21 09:15:00+00'),
('item-004', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'TECH-004', 'Apple Pencil', 99.99, 1, '2025-07-21 09:15:00+00'),

-- ORD-2024-4003 items (David Wilson - Freelancer)
('item-005', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'OFFICE-001', 'Ergonomic Keyboard', 89.99, 1, '2025-07-22 16:45:00+00'),
('item-006', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'OFFICE-002', 'Wireless Mouse', 89.99, 1, '2025-07-22 16:45:00+00'),

-- ORD-2024-4004 items (Emma Davis - Fashion)
('item-007', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'FASHION-001', 'Designer Handbag', 199.95, 1, '2025-07-23 11:20:00+00'),
('item-008', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'FASHION-002', 'Silk Scarf', 59.99, 1, '2025-07-23 11:20:00+00'),

-- ORD-2024-4005 items (Michael Thompson - Outdoor)
('item-009', 'e5f6g7h8-i9j0-1234-efgh-567890123456', 'OUTDOOR-001', 'Hiking Backpack 40L', 189.99, 1, '2025-07-24 13:50:00+00'),
('item-010', 'e5f6g7h8-i9j0-1234-efgh-567890123456', 'OUTDOOR-002', 'Camping Tent 2-Person', 199.99, 1, '2025-07-24 13:50:00+00'),

-- ORD-2024-4006 items (Sarah Jones - Home Office)
('item-011', 'f6g7h8i9-j0k1-2345-fghi-678901234567', 'HOME-001', 'Desk Organizer Set', 99.99, 1, '2025-07-25 10:30:00+00'),
('item-012', 'f6g7h8i9-j0k1-2345-fghi-678901234567', 'HOME-002', 'LED Desk Lamp', 99.99, 1, '2025-07-25 10:30:00+00'),

-- ORD-2024-4007 items (Robert Garcia - Consulting)
('item-013', 'g7h8i9j0-k1l2-3456-ghij-789012345678', 'BUSINESS-001', 'Business Card Holder', 29.99, 1, '2025-07-26 15:20:00+00'),
('item-014', 'g7h8i9j0-k1l2-3456-ghij-789012345678', 'BUSINESS-002', 'Professional Notebook', 19.99, 1, '2025-07-26 15:20:00+00'),
('item-015', 'g7h8i9j0-k1l2-3456-ghij-789012345678', 'BUSINESS-003', 'Executive Pen Set', 39.99, 1, '2025-07-26 15:20:00+00'),

-- ORD-2024-4008 items (Lisa Wang - Enterprise - High Value)
('item-016', 'h8i9j0k1-l2m3-4567-hijk-890123456789', 'PREMIUM-001', 'MacBook Pro 16" M2 Max', 1199.99, 1, '2025-07-27 12:00:00+00'),
('item-017', 'h8i9j0k1-l2m3-4567-hijk-890123456789', 'PREMIUM-002', 'Premium Laptop Stand', 99.99, 1, '2025-07-27 12:00:00+00'),

-- ORD-2024-4009 items (James Miller - Startup)
('item-018', 'i9j0k1l2-m3n4-5678-ijkl-901234567890', 'TECH-005', 'Monitor 27" 4K', 299.99, 1, '2025-07-28 08:45:00+00'),
('item-019', 'i9j0k1l2-m3n4-5678-ijkl-901234567890', 'TECH-006', 'Mechanical Keyboard RGB', 149.99, 1, '2025-07-28 08:45:00+00'),
('item-020', 'i9j0k1l2-m3n4-5678-ijkl-901234567890', 'TECH-007', 'Gaming Mouse Pro', 149.99, 1, '2025-07-28 08:45:00+00');