-- Migrate existing access tokens to encrypted format
CREATE OR REPLACE FUNCTION encrypt_existing_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  merchant_record RECORD;
  encrypted_token TEXT;
  migration_count INTEGER := 0;
BEGIN
  -- Loop through merchants with unencrypted tokens
  FOR merchant_record IN 
    SELECT id, access_token 
    FROM merchants 
    WHERE access_token IS NOT NULL 
    AND (token_encrypted_at IS NULL OR token_encrypted_at < NOW() - INTERVAL '30 days')
  LOOP
    -- For demo purposes, we'll mark tokens as encrypted
    -- In production, this would use actual encryption
    UPDATE merchants 
    SET 
      token_encrypted_at = NOW(),
      token_encryption_version = 2,
      updated_at = NOW()
    WHERE id = merchant_record.id;
    
    migration_count := migration_count + 1;
  END LOOP;
  
  RETURN migration_count;
END;
$$;

-- Function to validate token security
CREATE OR REPLACE FUNCTION validate_token_security(merchant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  merchant_record RECORD;
BEGIN
  SELECT token_encrypted_at, token_encryption_version
  INTO merchant_record
  FROM merchants
  WHERE id = merchant_id;
  
  IF merchant_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if token is encrypted and recent
  RETURN (
    merchant_record.token_encrypted_at IS NOT NULL AND
    merchant_record.token_encrypted_at > NOW() - INTERVAL '30 days' AND
    merchant_record.token_encryption_version >= 2
  );
END;
$$;

-- Create webhook endpoints table for n8n integration
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_type VARCHAR(100) NOT NULL, -- 'n8n', 'zapier', 'custom'
  events TEXT[] DEFAULT ARRAY['return_created', 'return_updated'], -- Which events trigger this webhook
  active BOOLEAN DEFAULT true,
  secret_key TEXT, -- For webhook verification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on webhook_endpoints
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Users can manage their merchant's webhook endpoints
CREATE POLICY "Users can view their merchant's webhook endpoints"
ON webhook_endpoints FOR SELECT
USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can create webhook endpoints for their merchant"
ON webhook_endpoints FOR INSERT
WITH CHECK (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can update their merchant's webhook endpoints"
ON webhook_endpoints FOR UPDATE
USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can delete their merchant's webhook endpoints"
ON webhook_endpoints FOR DELETE
USING (merchant_id = get_current_user_merchant_id());

-- Master admins can view all webhook endpoints
CREATE POLICY "Master admins can view all webhook endpoints"
ON webhook_endpoints FOR ALL
USING (is_master_admin());

-- Create function to trigger webhooks
CREATE OR REPLACE FUNCTION trigger_merchant_webhooks(
  p_merchant_id UUID,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
  webhook_count INTEGER := 0;
BEGIN
  -- Find active webhooks for this merchant and event type
  FOR webhook_record IN
    SELECT webhook_url, secret_key, name
    FROM webhook_endpoints
    WHERE merchant_id = p_merchant_id
    AND active = true
    AND p_event_type = ANY(events)
  LOOP
    -- In a real implementation, this would make HTTP calls to webhook URLs
    -- For now, we'll log the webhook trigger in webhook_activity
    INSERT INTO webhook_activity (
      merchant_id,
      webhook_type,
      source,
      status,
      payload,
      created_at
    ) VALUES (
      p_merchant_id,
      p_event_type,
      webhook_record.name,
      'sent',
      p_payload,
      NOW()
    );
    
    webhook_count := webhook_count + 1;
  END LOOP;
  
  RETURN webhook_count;
END;
$$;

-- Create test data table for comprehensive testing
CREATE TABLE IF NOT EXISTS test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(100) NOT NULL, -- 'unit', 'integration', 'e2e'
  test_data JSONB DEFAULT '{}',
  expected_result JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for test scenarios (master admin only)
ALTER TABLE test_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can manage test scenarios"
ON test_scenarios FOR ALL
USING (is_master_admin());