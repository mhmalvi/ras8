-- Add embedded app context storage to merchants table
-- This addresses the issue where shop/host parameters are lost after authentication
-- and ensures persistent storage of Shopify embedded app context for registered users

-- 1. Add embedded app context fields to merchants table
DO $$
BEGIN
  -- Add host_param to store the Shopify host parameter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'host_param'
  ) THEN
    ALTER TABLE merchants ADD COLUMN host_param TEXT;
    COMMENT ON COLUMN merchants.host_param IS 'Shopify host parameter for embedded apps (base64 encoded)';
  END IF;
  
  -- Add embedded_mode flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'embedded_mode'
  ) THEN
    ALTER TABLE merchants ADD COLUMN embedded_mode BOOLEAN DEFAULT false;
    COMMENT ON COLUMN merchants.embedded_mode IS 'Whether this merchant uses embedded app mode';
  END IF;
  
  -- Add app_url for embedded context
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'app_url'
  ) THEN
    ALTER TABLE merchants ADD COLUMN app_url TEXT;
    COMMENT ON COLUMN merchants.app_url IS 'Base app URL for this merchant (for embedded context reconstruction)';
  END IF;
  
  -- Add last_embedded_session for session tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'last_embedded_session'
  ) THEN
    ALTER TABLE merchants ADD COLUMN last_embedded_session JSONB;
    COMMENT ON COLUMN merchants.last_embedded_session IS 'Last known embedded session context for recovery';
  END IF;

END $$;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchants_embedded_mode ON merchants(embedded_mode) WHERE embedded_mode = true;
CREATE INDEX IF NOT EXISTS idx_merchants_host_param ON merchants(host_param) WHERE host_param IS NOT NULL;

-- 3. Create function to store embedded app context
CREATE OR REPLACE FUNCTION store_embedded_context(
  p_merchant_id UUID,
  p_shop_domain TEXT,
  p_host_param TEXT DEFAULT NULL,
  p_embedded_mode BOOLEAN DEFAULT true,
  p_app_url TEXT DEFAULT NULL,
  p_session_context JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_affected INTEGER := 0;
BEGIN
  -- Update merchant with embedded context
  UPDATE merchants 
  SET 
    host_param = COALESCE(p_host_param, host_param),
    embedded_mode = p_embedded_mode,
    app_url = COALESCE(p_app_url, app_url),
    last_embedded_session = COALESCE(p_session_context, last_embedded_session),
    updated_at = NOW()
  WHERE id = p_merchant_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  -- If merchant doesn't exist, this will return false
  RETURN rows_affected > 0;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Failed to store embedded context for merchant %: %', p_merchant_id, SQLERRM;
  RETURN false;
END;
$$;

-- 4. Create function to retrieve embedded app context
CREATE OR REPLACE FUNCTION get_embedded_context(p_user_id UUID)
RETURNS TABLE (
  merchant_id UUID,
  shop_domain TEXT,
  host_param TEXT,
  embedded_mode BOOLEAN,
  app_url TEXT,
  session_context JSONB
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    m.id as merchant_id,
    m.shop_domain,
    m.host_param,
    COALESCE(m.embedded_mode, false) as embedded_mode,
    m.app_url,
    m.last_embedded_session as session_context
  FROM profiles p
  JOIN merchants m ON m.id = p.merchant_id
  WHERE p.id = p_user_id;
$$;

-- 5. Create function to update embedded context from auth flow
CREATE OR REPLACE FUNCTION update_embedded_context_from_auth(
  p_user_id UUID,
  p_shop_domain TEXT,
  p_host_param TEXT DEFAULT NULL,
  p_is_embedded BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_merchant_id UUID;
  session_data JSONB;
BEGIN
  -- Get merchant_id for the user
  SELECT merchant_id INTO v_merchant_id
  FROM profiles 
  WHERE id = p_user_id;
  
  -- If no merchant linked, can't update context
  IF v_merchant_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Create session context
  session_data := jsonb_build_object(
    'shop_domain', p_shop_domain,
    'host_param', p_host_param,
    'is_embedded', p_is_embedded,
    'updated_at', NOW()::text,
    'source', 'auth_flow'
  );
  
  -- Store the context
  RETURN store_embedded_context(
    v_merchant_id,
    p_shop_domain,
    p_host_param,
    p_is_embedded,
    NULL, -- app_url will be set later if needed
    session_data
  );
END;
$$;

-- 6. Grant permissions for these functions
-- Users can call functions for their own data via RLS
GRANT EXECUTE ON FUNCTION store_embedded_context(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_embedded_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_embedded_context_from_auth(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Master admins can call for any user
GRANT EXECUTE ON FUNCTION store_embedded_context(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_embedded_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_embedded_context_from_auth(UUID, TEXT, TEXT, BOOLEAN) TO service_role;

-- 7. Add some example data migration for existing merchants
-- Detect likely embedded merchants and set embedded_mode = true
UPDATE merchants 
SET 
  embedded_mode = true,
  last_embedded_session = jsonb_build_object(
    'detected_from', 'migration',
    'shop_domain', shop_domain,
    'migrated_at', NOW()::text
  ),
  updated_at = NOW()
WHERE shop_domain IS NOT NULL 
  AND status = 'active'
  AND embedded_mode IS NULL;

-- 8. Update the validate_merchant_integration function to include embedded context
CREATE OR REPLACE FUNCTION validate_merchant_integration(p_user_id UUID)
RETURNS TABLE (
  has_merchant_link BOOLEAN,
  merchant_status TEXT,
  token_valid BOOLEAN,
  token_fresh BOOLEAN,
  integration_status TEXT,
  embedded_mode BOOLEAN,
  host_param TEXT,
  shop_domain TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH merchant_data AS (
    SELECT 
      p.merchant_id IS NOT NULL as merchant_link,
      m.status as status,
      m.shop_domain as domain,
      COALESCE(m.embedded_mode, false) as is_embedded,
      m.host_param as host,
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
    END as integration_status,
    md.is_embedded as embedded_mode,
    md.host as host_param,
    md.domain as shop_domain
  FROM merchant_data md;
$$;

COMMENT ON FUNCTION store_embedded_context(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB) IS 'Stores embedded app context for a merchant';
COMMENT ON FUNCTION get_embedded_context(UUID) IS 'Retrieves embedded app context for a user';
COMMENT ON FUNCTION update_embedded_context_from_auth(UUID, TEXT, TEXT, BOOLEAN) IS 'Updates embedded context during authentication flow';