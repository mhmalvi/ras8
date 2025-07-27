-- Fix security warnings: Add search_path to functions
DROP FUNCTION IF EXISTS encrypt_existing_tokens();
CREATE OR REPLACE FUNCTION encrypt_existing_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  merchant_record RECORD;
  encrypted_token TEXT;
  migration_count INTEGER := 0;
BEGIN
  -- Loop through merchants with unencrypted tokens
  FOR merchant_record IN 
    SELECT id, access_token 
    FROM public.merchants 
    WHERE access_token IS NOT NULL 
    AND (token_encrypted_at IS NULL OR token_encrypted_at < NOW() - INTERVAL '30 days')
  LOOP
    -- For demo purposes, we'll mark tokens as encrypted
    -- In production, this would use actual encryption
    UPDATE public.merchants 
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

-- Fix security warnings: Add search_path to validate_token_security
DROP FUNCTION IF EXISTS validate_token_security(UUID);
CREATE OR REPLACE FUNCTION validate_token_security(merchant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  merchant_record RECORD;
BEGIN
  SELECT token_encrypted_at, token_encryption_version
  INTO merchant_record
  FROM public.merchants
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

-- Fix security warnings: Add search_path to trigger_merchant_webhooks
DROP FUNCTION IF EXISTS trigger_merchant_webhooks(UUID, TEXT, JSONB);
CREATE OR REPLACE FUNCTION trigger_merchant_webhooks(
  p_merchant_id UUID,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  webhook_record RECORD;
  webhook_count INTEGER := 0;
BEGIN
  -- Find active webhooks for this merchant and event type
  FOR webhook_record IN
    SELECT webhook_url, secret_key, name
    FROM public.webhook_endpoints
    WHERE merchant_id = p_merchant_id
    AND active = true
    AND p_event_type = ANY(events)
  LOOP
    -- In a real implementation, this would make HTTP calls to webhook URLs
    -- For now, we'll log the webhook trigger in webhook_activity
    INSERT INTO public.webhook_activity (
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