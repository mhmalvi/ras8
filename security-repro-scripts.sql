-- ================================================================
-- CRITICAL SECURITY AUDIT - FAIL-FAST REPRODUCTION SCRIPTS
-- ================================================================
-- 
-- These scripts will reveal tenant isolation failures in your 
-- multi-tenant Shopify app. Run these to verify security issues.
--
-- WARNING: These queries may expose sensitive cross-tenant data.
-- Only run in a secure development environment.
--
-- ================================================================

-- ================================================================
-- 1. TENANT ISOLATION VERIFICATION
-- ================================================================

-- Test 1: Check if data is properly scoped by merchant
-- EXPECTED: Each merchant should only see their own data
-- FAILURE: If this shows multiple merchant_ids or NULLs, you have isolation issues

SELECT 'MERCHANT ISOLATION TEST' as test_name;
SELECT merchant_id, COUNT(*) as record_count 
FROM products 
GROUP BY merchant_id
ORDER BY record_count DESC;

-- Test 2: Detect orphaned data without merchant association
-- EXPECTED: 0 records without merchant_id
-- FAILURE: Any records without merchant_id indicate security vulnerability

SELECT 'ORPHANED DATA TEST' as test_name;
SELECT 
  'products' as table_name,
  COUNT(*) as orphaned_records
FROM products 
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as orphaned_records  
FROM orders
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'returns' as table_name,
  COUNT(*) as orphaned_records
FROM returns 
WHERE merchant_id IS NULL
UNION ALL
SELECT 
  'customers' as table_name,
  COUNT(*) as orphaned_records
FROM customers
WHERE merchant_id IS NULL;

-- Test 3: Cross-tenant data contamination check
-- EXPECTED: Each merchant should have distinct, non-overlapping data
-- FAILURE: If customer emails appear under multiple merchants, you have contamination

SELECT 'CROSS-TENANT CONTAMINATION TEST' as test_name;
SELECT 
  customer_email,
  COUNT(DISTINCT merchant_id) as merchant_count,
  array_agg(DISTINCT merchant_id) as merchants
FROM returns 
WHERE customer_email IS NOT NULL
GROUP BY customer_email
HAVING COUNT(DISTINCT merchant_id) > 1
LIMIT 10;

-- ================================================================
-- 2. RLS POLICY AUDIT
-- ================================================================

-- Test 4: Identify dangerous RLS policies that bypass security
-- EXPECTED: No policies with qual = 'true' (except for system tables)
-- FAILURE: Any policies with 'true' qualification allow public access

SELECT 'DANGEROUS RLS POLICIES TEST' as test_name;
SELECT 
  schemaname,
  tablename, 
  policyname,
  qual as policy_condition,
  CASE 
    WHEN qual = 'true' THEN 'CRITICAL: Public access'
    WHEN qual LIKE '%true%' THEN 'WARNING: Potential bypass'
    ELSE 'OK: Properly restricted'
  END as security_status
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual = 'true' OR qual LIKE '%true%')
ORDER BY 
  CASE WHEN qual = 'true' THEN 1 ELSE 2 END,
  tablename;

-- Test 5: Verify RLS is enabled on critical tables
-- EXPECTED: All tenant tables should have rowsecurity = true
-- FAILURE: Any tenant table with rowsecurity = false is vulnerable

SELECT 'RLS ENABLED TEST' as test_name;
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN 'SECURE: RLS enabled'
    ELSE 'CRITICAL: RLS disabled - public access!'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'merchants', 'products', 'customers', 'orders', 'order_items',
  'returns', 'return_items', 'analytics_events', 'billing_records',
  'ai_suggestions', 'profiles', 'users'
)
ORDER BY rowsecurity, tablename;

-- ================================================================
-- 3. MERCHANT DATA ISOLATION VERIFICATION  
-- ================================================================

-- Test 6: Per-merchant data counts (replace 'MERCHANT_A_ID' and 'MERCHANT_B_ID')
-- EXPECTED: Each merchant should have different, non-zero counts
-- FAILURE: If counts are identical or one merchant sees other's data, isolation failed

SELECT 'MERCHANT A DATA ISOLATION' as test_name;
-- Replace with actual merchant IDs from your test
-- SELECT COUNT(*) as product_count FROM products WHERE merchant_id = 'MERCHANT_A_ID';
-- SELECT COUNT(*) as order_count FROM orders WHERE merchant_id = 'MERCHANT_A_ID';  
-- SELECT COUNT(*) as return_count FROM returns WHERE merchant_id = 'MERCHANT_A_ID';

SELECT 'MERCHANT B DATA ISOLATION' as test_name;
-- Replace with actual merchant IDs from your test  
-- SELECT COUNT(*) as product_count FROM products WHERE merchant_id = 'MERCHANT_B_ID';
-- SELECT COUNT(*) as order_count FROM orders WHERE merchant_id = 'MERCHANT_B_ID';
-- SELECT COUNT(*) as return_count FROM returns WHERE merchant_id = 'MERCHANT_B_ID';

-- Test 7: Analytics events tenant isolation
-- EXPECTED: Events should be scoped to specific merchants
-- FAILURE: If events show multiple merchants or NULLs, analytics are contaminated

SELECT 'ANALYTICS ISOLATION TEST' as test_name;
SELECT 
  merchant_id,
  event_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM analytics_events 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY merchant_id, event_type
ORDER BY merchant_id, event_count DESC;

-- ================================================================
-- 4. CUSTOMER PORTAL SECURITY TEST
-- ================================================================

-- Test 8: Customer email access patterns
-- EXPECTED: Customers should only access data from their merchant context
-- FAILURE: If customer emails span multiple merchants, portal security is broken

SELECT 'CUSTOMER PORTAL SECURITY TEST' as test_name;
SELECT 
  customer_email,
  COUNT(DISTINCT merchant_id) as accessible_merchants,
  SUM(total_amount) as total_access_value,
  array_agg(DISTINCT merchant_id) as merchant_ids
FROM returns
WHERE customer_email LIKE '%@%'
GROUP BY customer_email  
HAVING COUNT(DISTINCT merchant_id) > 1
ORDER BY accessible_merchants DESC, total_access_value DESC
LIMIT 20;

-- ================================================================
-- 5. BILLING AND SUBSCRIPTION ISOLATION
-- ================================================================

-- Test 9: Billing records isolation
-- EXPECTED: Each merchant should have separate billing records
-- FAILURE: Shared or cross-referenced billing indicates financial data leak

SELECT 'BILLING ISOLATION TEST' as test_name;
SELECT 
  merchant_id,
  COUNT(*) as billing_records,
  SUM(amount) as total_billed,
  MIN(created_at) as first_bill,
  MAX(created_at) as last_bill
FROM billing_records
GROUP BY merchant_id
ORDER BY total_billed DESC;

-- Test 10: Subscription plan distribution  
-- EXPECTED: Independent plan distribution per merchant
-- FAILURE: If all merchants have same plan or suspicious patterns, investigate

SELECT 'SUBSCRIPTION PLAN TEST' as test_name;
SELECT 
  plan_type,
  COUNT(*) as merchant_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400), 2) as avg_days_old
FROM merchants
WHERE plan_type IS NOT NULL
GROUP BY plan_type
ORDER BY merchant_count DESC;

-- ================================================================
-- 6. SHOPIFY INTEGRATION ISOLATION
-- ================================================================

-- Test 11: Shopify shop domain uniqueness
-- EXPECTED: Each shop domain should map to exactly one merchant
-- FAILURE: Multiple merchants per shop indicates OAuth contamination

SELECT 'SHOPIFY DOMAIN ISOLATION TEST' as test_name;
SELECT 
  shop_domain,
  COUNT(*) as merchant_count,
  array_agg(id) as merchant_ids
FROM merchants
WHERE shop_domain IS NOT NULL
GROUP BY shop_domain
HAVING COUNT(*) > 1;

-- Test 12: Access token security check
-- EXPECTED: Each merchant should have unique, encrypted tokens
-- FAILURE: Duplicate or null tokens indicate OAuth security issues

SELECT 'OAUTH TOKEN SECURITY TEST' as test_name;
SELECT 
  CASE 
    WHEN access_token IS NULL THEN 'No token'
    WHEN LENGTH(access_token) < 20 THEN 'Suspicious short token'
    WHEN access_token LIKE 'shpat_%' THEN 'Valid Shopify token format'
    ELSE 'Unknown token format'
  END as token_status,
  COUNT(*) as merchant_count
FROM merchants
GROUP BY 
  CASE 
    WHEN access_token IS NULL THEN 'No token'
    WHEN LENGTH(access_token) < 20 THEN 'Suspicious short token'  
    WHEN access_token LIKE 'shpat_%' THEN 'Valid Shopify token format'
    ELSE 'Unknown token format'
  END
ORDER BY merchant_count DESC;

-- ================================================================
-- 7. AI SUGGESTIONS ISOLATION
-- ================================================================

-- Test 13: AI suggestions tenant scoping
-- EXPECTED: AI suggestions should be scoped through returns->merchant_id
-- FAILURE: Cross-tenant AI suggestions indicate data leakage

SELECT 'AI SUGGESTIONS ISOLATION TEST' as test_name;
SELECT 
  r.merchant_id,
  COUNT(ai.id) as suggestion_count,
  AVG(ai.confidence_score) as avg_confidence,
  COUNT(CASE WHEN ai.accepted = true THEN 1 END) as accepted_suggestions
FROM ai_suggestions ai
JOIN returns r ON ai.return_id = r.id
GROUP BY r.merchant_id
ORDER BY suggestion_count DESC;

-- ================================================================
-- 8. TEMPORAL DATA INTEGRITY
-- ================================================================

-- Test 14: Recent data creation patterns
-- EXPECTED: Recent data should follow normal business patterns
-- FAILURE: Sudden spikes or suspicious patterns may indicate data injection

SELECT 'RECENT DATA PATTERNS TEST' as test_name;
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders_created,
  COUNT(DISTINCT merchant_id) as active_merchants,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ================================================================
-- 9. PERFORMANCE AND SCALE INDICATORS
-- ================================================================

-- Test 15: Table size and distribution check
-- EXPECTED: Reasonable data distribution across tenants
-- FAILURE: Extreme skew may indicate data dumping or tenant imbalance

SELECT 'DATA DISTRIBUTION TEST' as test_name;
SELECT 
  'products' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT merchant_id) as unique_merchants,
  ROUND(COUNT(*)::float / NULLIF(COUNT(DISTINCT merchant_id), 0), 2) as avg_per_merchant
FROM products
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT merchant_id) as unique_merchants,
  ROUND(COUNT(*)::float / NULLIF(COUNT(DISTINCT merchant_id), 0), 2) as avg_per_merchant
FROM orders
UNION ALL
SELECT 
  'returns' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT merchant_id) as unique_merchants,
  ROUND(COUNT(*)::float / NULLIF(COUNT(DISTINCT merchant_id), 0), 2) as avg_per_merchant
FROM returns;

-- ================================================================
-- SECURITY REPORT SUMMARY
-- ================================================================

SELECT 'SECURITY AUDIT COMPLETE' as status;
SELECT 'Review all test results above for tenant isolation failures' as next_steps;
SELECT 'Any CRITICAL or WARNING findings require immediate attention' as priority;

-- ================================================================
-- RECOMMENDED IMMEDIATE ACTIONS IF TESTS FAIL:
-- ================================================================
--
-- 1. If "DANGEROUS RLS POLICIES TEST" shows policies with qual='true':
--    DROP those policies immediately and create proper tenant-scoped ones
--
-- 2. If "ORPHANED DATA TEST" shows records without merchant_id:
--    Add merchant_id columns and populate them correctly
--  
-- 3. If "CROSS-TENANT CONTAMINATION TEST" shows shared customer emails:
--    Investigate data injection points and fix webhook/API handlers
--
-- 4. If "RLS ENABLED TEST" shows disabled row security:
--    Enable RLS immediately: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
--
-- 5. If "CUSTOMER PORTAL SECURITY TEST" shows multi-tenant access:
--    Fix customer authentication and add proper merchant scoping
--
-- ================================================================