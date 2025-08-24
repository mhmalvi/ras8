-- Test RLS Policies
-- Run these queries to verify tenant isolation works correctly

-- Test 1: Simulate shop A access
SELECT set_config('request.jwt.claims', '{"shop": "shop-a.myshopify.com", "role": "authenticated"}', true);

-- Should only return shop A data
SELECT shop_domain, id FROM merchants WHERE shop_domain LIKE '%shop-a%';
SELECT COUNT(*) as shop_a_returns FROM returns WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain = 'shop-a.myshopify.com'
);

-- Test 2: Simulate shop B access  
SELECT set_config('request.jwt.claims', '{"shop": "shop-b.myshopify.com", "role": "authenticated"}', true);

-- Should only return shop B data
SELECT shop_domain, id FROM merchants WHERE shop_domain LIKE '%shop-b%';
SELECT COUNT(*) as shop_b_returns FROM returns WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain = 'shop-b.myshopify.com'
);

-- Test 3: Simulate service role (should see all data)
SELECT set_config('request.jwt.claims', '{"role": "service_role"}', true);

-- Should return all merchants
SELECT COUNT(*) as total_merchants FROM merchants;
SELECT COUNT(*) as total_returns FROM returns;
SELECT COUNT(*) as total_analytics FROM analytics_events;

-- Test 4: Simulate invalid shop (should see no data)
SELECT set_config('request.jwt.claims', '{"shop": "invalid-shop.myshopify.com", "role": "authenticated"}', true);

-- Should return 0 rows
SELECT COUNT(*) as invalid_shop_merchants FROM merchants;
SELECT COUNT(*) as invalid_shop_returns FROM returns;

-- Test 5: Reset to no JWT (should see no data for authenticated queries)
SELECT set_config('request.jwt.claims', '', true);

-- Should return 0 rows
SELECT COUNT(*) as no_jwt_merchants FROM merchants;

-- Verification Summary
DO $$
BEGIN
  RAISE NOTICE '=== RLS POLICY TEST SUMMARY ===';
  RAISE NOTICE 'If all tests passed:';
  RAISE NOTICE '✅ Each shop sees only their own data';
  RAISE NOTICE '✅ Service role sees all data';  
  RAISE NOTICE '✅ Invalid shops see no data';
  RAISE NOTICE '✅ No JWT sees no data';
  RAISE NOTICE '================================';
END $$;