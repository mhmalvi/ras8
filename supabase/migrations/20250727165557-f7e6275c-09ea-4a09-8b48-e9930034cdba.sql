-- Fix security warnings by setting search_path for functions

-- Update update_notifications_updated_at function
DROP FUNCTION IF EXISTS public.update_notifications_updated_at();
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update create_notification function
DROP FUNCTION IF EXISTS public.create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, VARCHAR(20), JSONB);
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
SET search_path = ''
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

-- Update notify_return_events function
DROP FUNCTION IF EXISTS public.notify_return_events();
CREATE OR REPLACE FUNCTION public.notify_return_events()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Update notify_ai_suggestion_events function
DROP FUNCTION IF EXISTS public.notify_ai_suggestion_events();
CREATE OR REPLACE FUNCTION public.notify_ai_suggestion_events()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;