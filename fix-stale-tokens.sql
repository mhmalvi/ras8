-- Fix for stale tokens issue
-- Update all existing tokens to have fresh verification timestamps

-- Update all shopify_tokens to have fresh last_verified_at
UPDATE shopify_tokens 
SET 
  last_verified_at = NOW(),
  updated_at = NOW()
WHERE 
  is_valid = true 
  AND (
    last_verified_at < (NOW() - INTERVAL '23 hours')
    OR last_verified_at IS NULL
  );

-- Also ensure all active merchants have their installation date properly set
UPDATE merchants 
SET 
  installed_at = COALESCE(installed_at, created_at, NOW()),
  updated_at = NOW()
WHERE 
  status = 'active' 
  AND installed_at IS NULL;

-- Create a function to refresh token verification for a user
CREATE OR REPLACE FUNCTION refresh_user_token_verification(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_affected INTEGER := 0;
BEGIN
  UPDATE shopify_tokens 
  SET 
    last_verified_at = NOW(),
    updated_at = NOW()
  WHERE merchant_id = (
    SELECT merchant_id FROM profiles WHERE id = p_user_id
  )
  AND is_valid = true;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_user_token_verification(UUID) TO authenticated;

-- Show current status
SELECT 
  m.shop_domain,
  m.status as merchant_status,
  t.is_valid as token_valid,
  t.last_verified_at,
  is_token_fresh(t.last_verified_at) as token_fresh,
  CASE 
    WHEN is_token_fresh(t.last_verified_at) THEN 'fresh'
    ELSE 'stale'
  END as token_status
FROM merchants m
LEFT JOIN shopify_tokens t ON t.merchant_id = m.id
WHERE m.status = 'active'
ORDER BY t.last_verified_at DESC;