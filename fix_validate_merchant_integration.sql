-- Fix ambiguous column reference in validate_merchant_integration function
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
      p.merchant_id IS NOT NULL as merchant_link,
      m.status as status,
      t.is_valid as token_is_valid,
      is_token_fresh(t.last_verified_at) as token_is_fresh
    FROM profiles p
    LEFT JOIN merchants m ON m.id = p.merchant_id
    LEFT JOIN shopify_tokens t ON t.merchant_id = m.id
    WHERE p.id = p_user_id
  )
  SELECT 
    md.merchant_link as has_merchant_link,
    md.status as merchant_status,
    md.token_is_valid as token_valid,
    md.token_is_fresh as token_fresh,
    CASE 
      WHEN NOT md.merchant_link THEN 'no-merchant-link'
      WHEN md.status = 'uninstalled' THEN 'uninstalled'
      WHEN md.status != 'active' THEN 'inactive'
      WHEN NOT COALESCE(md.token_is_valid, false) THEN 'invalid-token'
      WHEN NOT COALESCE(md.token_is_fresh, false) THEN 'stale-token'
      WHEN md.status = 'active' AND COALESCE(md.token_is_valid, false) AND COALESCE(md.token_is_fresh, false) THEN 'integrated-active'
      ELSE 'unknown'
    END as integration_status
  FROM merchant_data md;
$$;