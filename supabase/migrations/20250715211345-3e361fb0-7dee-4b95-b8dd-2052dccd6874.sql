-- First, let's see what data needs to be cleaned up
SELECT 
  'analytics_events' as table_name,
  COUNT(*) as null_count
FROM analytics_events 
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'billing_records' as table_name,
  COUNT(*) as null_count  
FROM billing_records
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'returns' as table_name,
  COUNT(*) as null_count
FROM returns 
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'webhook_activity' as table_name,
  COUNT(*) as null_count
FROM webhook_activity
WHERE merchant_id IS NULL;