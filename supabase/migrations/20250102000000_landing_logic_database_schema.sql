-- Landing Logic Database Schema Implementation
-- Phase 0: Create proper merchant/token separation and constraints

-- 1. Create dedicated shopify_tokens table
CREATE TABLE IF NOT EXISTS shopify_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- encrypted
  scopes TEXT[] DEFAULT ARRAY['read_orders','write_orders','read_customers','read_products'],
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For future token refresh support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT shopify_tokens_merchant_unique UNIQUE(merchant_id) -- One active token per merchant
);

-- 2. Add missing merchant fields for proper status tracking
DO $$
BEGIN
  -- Add shop_id if it doesn't exist (Shopify's internal shop ID)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'shop_id'
  ) THEN
    ALTER TABLE merchants ADD COLUMN shop_id BIGINT;
  END IF;
  
  -- Add status enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'status'
  ) THEN
    ALTER TABLE merchants ADD COLUMN status TEXT DEFAULT 'active' 
      CHECK (status IN ('active','uninstalled','pending','suspended'));
  END IF;
  
  -- Add installed_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'installed_at'
  ) THEN
    ALTER TABLE merchants ADD COLUMN installed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add uninstalled_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'uninstalled_at'
  ) THEN
    ALTER TABLE merchants ADD COLUMN uninstalled_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Migrate existing tokens from merchants to shopify_tokens table
INSERT INTO shopify_tokens (merchant_id, access_token, is_valid, last_verified_at, created_at)
SELECT 
  id as merchant_id,
  COALESCE(access_token, 'migrated_token') as access_token,
  CASE 
    WHEN access_token IS NOT NULL THEN true 
    ELSE false 
  END as is_valid,
  COALESCE(token_encrypted_at, created_at, NOW()) as last_verified_at,
  COALESCE(created_at, NOW()) as created_at
FROM merchants 
WHERE id NOT IN (SELECT merchant_id FROM shopify_tokens)
ON CONFLICT (merchant_id) DO NOTHING;

-- 4. Remove token columns from merchants table (after migration)
DO $$
BEGIN
  -- Remove access_token column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE merchants DROP COLUMN access_token;
  END IF;
  
  -- Remove token_encrypted_at column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'token_encrypted_at'
  ) THEN
    ALTER TABLE merchants DROP COLUMN token_encrypted_at;
  END IF;
  
  -- Remove token_encryption_version column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'token_encryption_version'
  ) THEN
    ALTER TABLE merchants DROP COLUMN token_encryption_version;
  END IF;
END $$;

-- 5. Add critical unique constraints
DO $$
BEGIN
  -- Unique constraint on shop_domain
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchants_shop_domain_unique'
  ) THEN
    CREATE UNIQUE INDEX merchants_shop_domain_unique ON merchants(shop_domain) 
    WHERE shop_domain IS NOT NULL;
  END IF;
  
  -- Unique constraint on shop_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchants_shop_id_unique'
  ) THEN
    CREATE UNIQUE INDEX merchants_shop_id_unique ON merchants(shop_id) 
    WHERE shop_id IS NOT NULL;
  END IF;
END $$;

-- 6. Enable RLS on shopify_tokens table
ALTER TABLE shopify_tokens ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for shopify_tokens
CREATE POLICY "Users can view their merchant's tokens" ON shopify_tokens
FOR SELECT USING (
  merchant_id IN (
    SELECT merchant_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage their merchant's tokens" ON shopify_tokens
FOR ALL USING (
  merchant_id IN (
    SELECT merchant_id FROM profiles WHERE id = auth.uid()
  )
);

-- Master admins can view all tokens
CREATE POLICY "Master admins can view all tokens" ON shopify_tokens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_tokens_merchant_id ON shopify_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shopify_tokens_is_valid ON shopify_tokens(is_valid);
CREATE INDEX IF NOT EXISTS idx_shopify_tokens_last_verified ON shopify_tokens(last_verified_at);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_shop_domain ON merchants(shop_domain);
CREATE INDEX IF NOT EXISTS idx_merchants_shop_id ON merchants(shop_id);

-- 9. Create helper functions for landing logic
CREATE OR REPLACE FUNCTION get_merchant_with_token(p_merchant_id UUID)
RETURNS TABLE (
  merchant_id UUID,
  shop_domain TEXT,
  shop_id BIGINT,
  status TEXT,
  installed_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ,
  token_id UUID,
  access_token TEXT,
  token_is_valid BOOLEAN,
  last_verified_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    m.id as merchant_id,
    m.shop_domain,
    m.shop_id,
    m.status,
    m.installed_at,
    m.uninstalled_at,
    t.id as token_id,
    t.access_token,
    t.is_valid as token_is_valid,
    t.last_verified_at
  FROM merchants m
  LEFT JOIN shopify_tokens t ON t.merchant_id = m.id
  WHERE m.id = p_merchant_id;
$$;

-- 10. Create function to check token freshness (24h threshold)
CREATE OR REPLACE FUNCTION is_token_fresh(last_verified TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT last_verified > (NOW() - INTERVAL '24 hours');
$$;

-- 11. Create function to mark merchant as uninstalled (for webhook use)
CREATE OR REPLACE FUNCTION mark_merchant_uninstalled(p_shop_domain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_affected INTEGER := 0;
BEGIN
  -- Update merchant status
  UPDATE merchants 
  SET 
    status = 'uninstalled',
    uninstalled_at = NOW(),
    updated_at = NOW()
  WHERE shop_domain = p_shop_domain;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  -- Invalidate tokens
  IF rows_affected > 0 THEN
    UPDATE shopify_tokens 
    SET 
      is_valid = false,
      updated_at = NOW()
    WHERE merchant_id = (
      SELECT id FROM merchants WHERE shop_domain = p_shop_domain
    );
  END IF;
  
  RETURN rows_affected > 0;
END;
$$;

-- 12. Create function to validate merchant integration status
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
    has_merchant_link,
    merchant_status,
    token_valid,
    token_fresh,
    CASE 
      WHEN NOT has_merchant_link THEN 'no-merchant-link'
      WHEN merchant_status = 'uninstalled' THEN 'uninstalled'
      WHEN merchant_status != 'active' THEN 'inactive'
      WHEN NOT COALESCE(token_valid, false) THEN 'invalid-token'
      WHEN NOT COALESCE(token_fresh, false) THEN 'stale-token'
      WHEN merchant_status = 'active' AND COALESCE(token_valid, false) AND COALESCE(token_fresh, false) THEN 'integrated-active'
      ELSE 'unknown'
    END as integration_status
  FROM merchant_data;
$$;

-- 13. Create webhook activity tracking (for observability)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'app/uninstalled', 'orders/paid', etc.
  payload JSONB,
  hmac_valid BOOLEAN,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_status TEXT DEFAULT 'success' CHECK (processing_status IN ('success', 'failed', 'retry')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_shop_domain ON webhook_events(shop_domain);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);

-- Enable RLS on webhook_events (master admin only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can view all webhook events" ON webhook_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- 14. Update existing merchants to have proper status
UPDATE merchants 
SET status = 'active', installed_at = COALESCE(created_at, NOW())
WHERE status IS NULL OR status = '';

COMMENT ON TABLE shopify_tokens IS 'Stores encrypted Shopify access tokens separately from merchant data';
COMMENT ON TABLE webhook_events IS 'Tracks webhook events for observability and debugging';
COMMENT ON FUNCTION get_merchant_with_token(UUID) IS 'Returns complete merchant data with token info for landing logic';
COMMENT ON FUNCTION validate_merchant_integration(UUID) IS 'Validates user merchant integration status for landing decisions';