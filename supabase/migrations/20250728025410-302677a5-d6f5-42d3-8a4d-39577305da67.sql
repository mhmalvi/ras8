-- Add order items for the test orders
-- First get the order IDs that were just created
WITH order_data AS (
  SELECT id, shopify_order_id FROM orders 
  WHERE shopify_order_id IN ('ORD-2024-4001', 'ORD-2024-4002', 'ORD-2024-4003', 'ORD-2024-4004', 'ORD-2024-4005', 'ORD-2024-4006', 'ORD-2024-4007', 'ORD-2024-4008', 'ORD-2024-4009')
)
INSERT INTO order_items (order_id, product_id, product_name, price, quantity, created_at)
SELECT 
  od.id,
  items.product_id,
  items.product_name,
  items.price,
  items.quantity,
  items.created_at
FROM order_data od
JOIN (
  VALUES 
    -- ORD-2024-4001 items (Alex Martinez - Tech Startup)
    ('ORD-2024-4001', 'TECH-001', 'MacBook Pro 13" M2', 399.99, 1, '2025-07-20 14:30:00+00'::timestamptz),
    ('ORD-2024-4001', 'TECH-002', 'Wireless Charging Pad', 49.99, 1, '2025-07-20 14:30:00+00'::timestamptz),
    
    -- ORD-2024-4002 items (Jessica Brown - Digital Agency)
    ('ORD-2024-4002', 'TECH-003', 'iPad Air 64GB', 199.99, 1, '2025-07-21 09:15:00+00'::timestamptz),
    ('ORD-2024-4002', 'TECH-004', 'Apple Pencil', 99.99, 1, '2025-07-21 09:15:00+00'::timestamptz),
    
    -- ORD-2024-4003 items (David Wilson - Freelancer)
    ('ORD-2024-4003', 'OFFICE-001', 'Ergonomic Keyboard', 89.99, 1, '2025-07-22 16:45:00+00'::timestamptz),
    ('ORD-2024-4003', 'OFFICE-002', 'Wireless Mouse', 89.99, 1, '2025-07-22 16:45:00+00'::timestamptz),
    
    -- ORD-2024-4004 items (Emma Davis - Fashion)
    ('ORD-2024-4004', 'FASHION-001', 'Designer Handbag', 199.95, 1, '2025-07-23 11:20:00+00'::timestamptz),
    ('ORD-2024-4004', 'FASHION-002', 'Silk Scarf', 59.99, 1, '2025-07-23 11:20:00+00'::timestamptz),
    
    -- ORD-2024-4005 items (Michael Thompson - Outdoor)
    ('ORD-2024-4005', 'OUTDOOR-001', 'Hiking Backpack 40L', 189.99, 1, '2025-07-24 13:50:00+00'::timestamptz),
    ('ORD-2024-4005', 'OUTDOOR-002', 'Camping Tent 2-Person', 199.99, 1, '2025-07-24 13:50:00+00'::timestamptz),
    
    -- ORD-2024-4006 items (Sarah Jones - Home Office)
    ('ORD-2024-4006', 'HOME-001', 'Desk Organizer Set', 99.99, 1, '2025-07-25 10:30:00+00'::timestamptz),
    ('ORD-2024-4006', 'HOME-002', 'LED Desk Lamp', 99.99, 1, '2025-07-25 10:30:00+00'::timestamptz),
    
    -- ORD-2024-4007 items (Robert Garcia - Consulting)
    ('ORD-2024-4007', 'BUSINESS-001', 'Business Card Holder', 29.99, 1, '2025-07-26 15:20:00+00'::timestamptz),
    ('ORD-2024-4007', 'BUSINESS-002', 'Professional Notebook', 19.99, 1, '2025-07-26 15:20:00+00'::timestamptz),
    ('ORD-2024-4007', 'BUSINESS-003', 'Executive Pen Set', 39.99, 1, '2025-07-26 15:20:00+00'::timestamptz),
    
    -- ORD-2024-4008 items (Lisa Wang - Enterprise - High Value)
    ('ORD-2024-4008', 'PREMIUM-001', 'MacBook Pro 16" M2 Max', 1199.99, 1, '2025-07-27 12:00:00+00'::timestamptz),
    ('ORD-2024-4008', 'PREMIUM-002', 'Premium Laptop Stand', 99.99, 1, '2025-07-27 12:00:00+00'::timestamptz),
    
    -- ORD-2024-4009 items (James Miller - Startup)
    ('ORD-2024-4009', 'TECH-005', 'Monitor 27" 4K', 299.99, 1, '2025-07-28 08:45:00+00'::timestamptz),
    ('ORD-2024-4009', 'TECH-006', 'Mechanical Keyboard RGB', 149.99, 1, '2025-07-28 08:45:00+00'::timestamptz),
    ('ORD-2024-4009', 'TECH-007', 'Gaming Mouse Pro', 149.99, 1, '2025-07-28 08:45:00+00'::timestamptz)
) AS items(order_num, product_id, product_name, price, quantity, created_at) 
ON od.shopify_order_id = items.order_num;