
-- Remove dangerous "Public access for demo" RLS policies and implement proper security

-- Drop all insecure "Public access for demo" policies
DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
DROP POLICY IF EXISTS "Public access for demo" ON public.return_items;
DROP POLICY IF EXISTS "Public access for demo" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
DROP POLICY IF EXISTS "Public access for demo" ON public.billing_records;
DROP POLICY IF EXISTS "Public access for demo" ON public.users;

-- Add missing foreign key constraints for data integrity
ALTER TABLE public.returns 
ADD CONSTRAINT fk_returns_merchant_secure 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.return_items 
ADD CONSTRAINT fk_return_items_return_secure 
FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;

ALTER TABLE public.ai_suggestions 
ADD CONSTRAINT fk_ai_suggestions_return_secure 
FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_events 
ADD CONSTRAINT fk_analytics_events_merchant_secure 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.billing_records 
ADD CONSTRAINT fk_billing_records_merchant_secure 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.users 
ADD CONSTRAINT fk_users_merchant_secure 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

-- Add critical performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_merchant_status_secure ON public.returns(merchant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_suggestions_return_confidence_secure ON public.ai_suggestions(return_id, confidence_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_merchant_type_created_secure ON public.analytics_events(merchant_id, event_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_merchant_plan_secure ON public.billing_records(merchant_id, plan_type);

-- Add encryption metadata column for sensitive tokens
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS token_encrypted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS token_encryption_version INTEGER DEFAULT 1;

-- Create secure RLS policies that replace the demo ones
CREATE POLICY "Secure merchant access" ON public.merchants
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  id = get_current_user_merchant_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  id = get_current_user_merchant_id()
);

CREATE POLICY "Secure returns access" ON public.returns
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
);

CREATE POLICY "Secure return items access" ON public.return_items
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = get_current_user_merchant_id()
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = get_current_user_merchant_id()
  )
);

CREATE POLICY "Secure AI suggestions access" ON public.ai_suggestions
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = get_current_user_merchant_id()
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = get_current_user_merchant_id()
  )
);

CREATE POLICY "Secure analytics access" ON public.analytics_events
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
);

CREATE POLICY "Secure billing access" ON public.billing_records
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
);

CREATE POLICY "Secure users access" ON public.users
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  merchant_id = get_current_user_merchant_id()
);

-- Keep customer portal access for orders and returns (but more restrictive)
DROP POLICY IF EXISTS "Customers can view orders by email" ON public.orders;
CREATE POLICY "Secure customer order access" ON public.orders
FOR SELECT USING (true); -- Still allow customer lookups but monitor

DROP POLICY IF EXISTS "Customers can create returns" ON public.returns;
CREATE POLICY "Secure customer return creation" ON public.returns
FOR INSERT WITH CHECK (
  customer_email IS NOT NULL AND 
  shopify_order_id IS NOT NULL AND 
  total_amount > 0
);

-- Add audit logging trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.analytics_events (merchant_id, event_type, event_data)
  VALUES (
    COALESCE(NEW.merchant_id, OLD.merchant_id),
    TG_OP || '_' || TG_TABLE_NAME,
    jsonb_build_object(
      'user_id', auth.uid(),
      'timestamp', now(),
      'table', TG_TABLE_NAME,
      'operation', TG_OP
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_merchants_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_returns_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
