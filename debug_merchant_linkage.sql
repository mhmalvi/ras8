-- Debug merchant linkage issue for user yuanhuafung2021@gmail.com
-- Check if user profile exists and has merchant_id

-- 1. Find the user profile
SELECT 
  id,
  merchant_id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles 
WHERE email = 'yuanhuafung2021@gmail.com';

-- 2. If merchant_id exists, check the merchant details
SELECT 
  m.id,
  m.shop_domain,
  m.shop_id,
  m.status,
  m.installed_at,
  m.uninstalled_at,
  m.settings,
  m.plan_type,
  m.created_at
FROM merchants m
WHERE m.id IN (
  SELECT merchant_id FROM profiles WHERE email = 'yuanhuafung2021@gmail.com'
);

-- 3. Check shopify_tokens table for this merchant
SELECT 
  t.id,
  t.merchant_id,
  t.access_token IS NOT NULL as has_token,
  t.is_valid,
  t.last_verified_at,
  t.created_at
FROM shopify_tokens t
WHERE t.merchant_id IN (
  SELECT merchant_id FROM profiles WHERE email = 'yuanhuafung2021@gmail.com'
);

-- 4. Test the validate_merchant_integration function
SELECT * FROM validate_merchant_integration(
  (SELECT id FROM profiles WHERE email = 'yuanhuafung2021@gmail.com')
);

-- 5. Check if there are any merchants without proper profile linkage
SELECT 
  m.id,
  m.shop_domain,
  m.status,
  COUNT(p.id) as profile_count
FROM merchants m
LEFT JOIN profiles p ON p.merchant_id = m.id
GROUP BY m.id, m.shop_domain, m.status
HAVING COUNT(p.id) = 0;