
-- Create webhook_activity table for monitoring webhook events
CREATE TABLE public.webhook_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  webhook_type VARCHAR(100) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('shopify', 'n8n', 'internal')),
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed')),
  payload JSONB,
  response JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_webhook_activity_merchant_created ON public.webhook_activity(merchant_id, created_at DESC);
CREATE INDEX idx_webhook_activity_status ON public.webhook_activity(status);
CREATE INDEX idx_webhook_activity_type ON public.webhook_activity(webhook_type);

-- Enable RLS
ALTER TABLE public.webhook_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their merchant's webhook activity" 
  ON public.webhook_activity 
  FOR SELECT 
  USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can create webhook activity for their merchant" 
  ON public.webhook_activity 
  FOR INSERT 
  WITH CHECK (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can update their merchant's webhook activity" 
  ON public.webhook_activity 
  FOR UPDATE 
  USING (merchant_id = get_current_user_merchant_id());

-- Public access for demo purposes
CREATE POLICY "Public access for webhook activity demo" 
  ON public.webhook_activity 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
