-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their merchant's notifications"
  ON public.notifications
  FOR SELECT
  USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Users can update their merchant's notifications"
  ON public.notifications
  FOR UPDATE
  USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Master admins can view all notifications"
  ON public.notifications
  FOR SELECT
  USING (is_master_admin());

-- Create indexes for better performance
CREATE INDEX idx_notifications_merchant_id ON public.notifications(merchant_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(merchant_id, read);
CREATE INDEX idx_notifications_type ON public.notifications(merchant_id, type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- Create function to automatically create notifications for events
CREATE OR REPLACE FUNCTION public.create_notification(
  p_merchant_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    merchant_id,
    type,
    title,
    message,
    priority,
    data
  ) VALUES (
    p_merchant_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_data
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Create triggers to automatically generate notifications for returns
CREATE OR REPLACE FUNCTION public.notify_return_events()
RETURNS TRIGGER AS $$
BEGIN
  -- New return request
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.merchant_id,
      'return',
      'New Return Request',
      'Customer ' || NEW.customer_email || ' requested return for Order #' || NEW.shopify_order_id,
      'high',
      jsonb_build_object(
        'return_id', NEW.id,
        'order_id', NEW.shopify_order_id,
        'customer_email', NEW.customer_email
      )
    );
    RETURN NEW;
  END IF;

  -- Return status update
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.create_notification(
      NEW.merchant_id,
      'return_status',
      'Return Status Updated',
      'Return for Order #' || NEW.shopify_order_id || ' status changed to ' || NEW.status,
      CASE 
        WHEN NEW.status = 'completed' THEN 'low'
        WHEN NEW.status = 'approved' THEN 'medium'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'return_id', NEW.id,
        'order_id', NEW.shopify_order_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for return notifications
CREATE TRIGGER return_notification_trigger
  AFTER INSERT OR UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_return_events();

-- Create function to notify on AI suggestions
CREATE OR REPLACE FUNCTION public.notify_ai_suggestion_events()
RETURNS TRIGGER AS $$
DECLARE
  merchant_id_val UUID;
BEGIN
  -- Get merchant_id from the related return
  SELECT r.merchant_id INTO merchant_id_val
  FROM public.returns r
  WHERE r.id = NEW.return_id;

  IF merchant_id_val IS NOT NULL THEN
    PERFORM public.create_notification(
      merchant_id_val,
      'ai_suggestion',
      'AI Suggestion Available',
      'High confidence suggestion available (' || ROUND(NEW.confidence_score * 100) || '% match)',
      'medium',
      jsonb_build_object(
        'return_id', NEW.return_id,
        'suggestion_id', NEW.id,
        'confidence_score', NEW.confidence_score,
        'suggestion_type', NEW.suggestion_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AI suggestion notifications
CREATE TRIGGER ai_suggestion_notification_trigger
  AFTER INSERT ON public.ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ai_suggestion_events();