-- Fix ambiguous column reference in validate_merchant_integration function
-- This fixes the 42702 error by adding explicit table aliases

CREATE OR REPLACE FUNCTION validate_merchant_integration(p_user_id UUID)
RETURNS TABLE (
  has_merchant_link BOOLEAN,
  merchant_status TEXT,
  token_valid BOOLEAN,
  token_fresh BOOLEAN,
  integration_status TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH merchant_data AS (
    SELECT 
      p.merchant_id IS NOT NULL as has_merchant_link,
      m.status as merchant_status,
      t.is_valid as token_valid,
      is_token_fresh(t.last_verified_at) as token_fresh
    FROM profiles p
    LEFT JOIN merchants m ON m.id = p.merchant_id
    LEFT JOIN shopify_tokens t ON t.merchant_id = m.id
    WHERE p.id = p_user_id
  )
  SELECT 
    md.has_merchant_link,
    md.merchant_status,
    md.token_valid,
    md.token_fresh,
    CASE 
      WHEN NOT md.has_merchant_link THEN 'no-merchant-link'
      WHEN md.merchant_status = 'uninstalled' THEN 'uninstalled'
      WHEN md.merchant_status != 'active' THEN 'inactive'
      WHEN NOT COALESCE(md.token_valid, false) THEN 'invalid-token'
      WHEN NOT COALESCE(md.token_fresh, false) THEN 'stale-token'
      WHEN md.merchant_status = 'active' AND COALESCE(md.token_valid, false) AND COALESCE(md.token_fresh, false) THEN 'integrated-active'
      ELSE 'unknown'
    END as integration_status
  FROM merchant_data md;
$$;