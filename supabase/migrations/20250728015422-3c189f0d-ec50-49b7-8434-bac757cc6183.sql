-- Add more test notifications for the current merchant
INSERT INTO public.notifications (merchant_id, type, title, message, priority, read, data) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'billing',
  'Plan Usage Alert',
  'You have used 85% of your monthly return quota',
  'high',
  false,
  '{"usage_percent": 85, "plan_type": "growth"}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'system',
  'System Maintenance',
  'Scheduled maintenance window: Sunday 2AM-4AM EST',
  'low',
  false,
  '{"maintenance_date": "2025-02-02", "duration_hours": 2}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'return',
  'Return Rejected',
  'Return for Order #1003 has been rejected due to policy violation',
  'medium',
  false,
  '{"order_id": "1003", "reason": "policy_violation", "customer_email": "customer@example.com"}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'ai_suggestion',
  'Bulk AI Processing Complete',
  'AI has processed 15 new returns with exchange suggestions',
  'medium',
  false,
  '{"processed_count": 15, "success_rate": 92, "avg_confidence": 0.87}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'return',
  'Customer Follow-up Required',
  'Customer jane@example.com is waiting for return approval (Order #1004)',
  'high',
  false,
  '{"order_id": "1004", "customer_email": "jane@example.com", "days_waiting": 3}'
);