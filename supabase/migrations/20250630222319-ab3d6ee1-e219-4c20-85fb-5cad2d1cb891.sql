
-- First, let's create proper foreign key relationships and RLS policies
-- We need to check for existing constraints before adding them

-- Add foreign key constraints (without IF NOT EXISTS)
DO $$
BEGIN
    -- Add foreign key for returns -> merchants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_returns_merchant' 
        AND table_name = 'returns'
    ) THEN
        ALTER TABLE public.returns 
        ADD CONSTRAINT fk_returns_merchant 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for return_items -> returns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_return_items_return' 
        AND table_name = 'return_items'
    ) THEN
        ALTER TABLE public.return_items 
        ADD CONSTRAINT fk_return_items_return 
        FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for ai_suggestions -> returns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ai_suggestions_return' 
        AND table_name = 'ai_suggestions'
    ) THEN
        ALTER TABLE public.ai_suggestions 
        ADD CONSTRAINT fk_ai_suggestions_return 
        FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for analytics_events -> merchants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_analytics_events_merchant' 
        AND table_name = 'analytics_events'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD CONSTRAINT fk_analytics_events_merchant 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for billing_records -> merchants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_billing_records_merchant' 
        AND table_name = 'billing_records'
    ) THEN
        ALTER TABLE public.billing_records 
        ADD CONSTRAINT fk_billing_records_merchant 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for users -> merchants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_merchant' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT fk_users_merchant 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create a profiles table to link auth.users to merchants
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user's merchant_id
CREATE OR REPLACE FUNCTION public.get_current_user_merchant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT merchant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for merchants
CREATE POLICY "Users can view their own merchant" ON public.merchants
FOR SELECT USING (id = public.get_current_user_merchant_id());

CREATE POLICY "Users can update their own merchant" ON public.merchants
FOR UPDATE USING (id = public.get_current_user_merchant_id());

-- Create RLS policies for returns
CREATE POLICY "Users can view their merchant's returns" ON public.returns
FOR SELECT USING (merchant_id = public.get_current_user_merchant_id());

CREATE POLICY "Users can create returns for their merchant" ON public.returns
FOR INSERT WITH CHECK (merchant_id = public.get_current_user_merchant_id());

CREATE POLICY "Users can update their merchant's returns" ON public.returns
FOR UPDATE USING (merchant_id = public.get_current_user_merchant_id());

-- Create RLS policies for return_items
CREATE POLICY "Users can view return items for their merchant's returns" ON public.return_items
FOR SELECT USING (
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = public.get_current_user_merchant_id()
  )
);

CREATE POLICY "Users can create return items for their merchant's returns" ON public.return_items
FOR INSERT WITH CHECK (
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = public.get_current_user_merchant_id()
  )
);

-- Create RLS policies for ai_suggestions
CREATE POLICY "Users can view AI suggestions for their merchant's returns" ON public.ai_suggestions
FOR SELECT USING (
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = public.get_current_user_merchant_id()
  )
);

CREATE POLICY "Users can create AI suggestions for their merchant's returns" ON public.ai_suggestions
FOR INSERT WITH CHECK (
  return_id IN (
    SELECT id FROM public.returns 
    WHERE merchant_id = public.get_current_user_merchant_id()
  )
);

-- Create RLS policies for analytics_events
CREATE POLICY "Users can view their merchant's analytics" ON public.analytics_events
FOR SELECT USING (merchant_id = public.get_current_user_merchant_id());

CREATE POLICY "Users can create analytics for their merchant" ON public.analytics_events
FOR INSERT WITH CHECK (merchant_id = public.get_current_user_merchant_id());

-- Create RLS policies for billing_records
CREATE POLICY "Users can view their merchant's billing" ON public.billing_records
FOR SELECT USING (merchant_id = public.get_current_user_merchant_id());

-- Create RLS policies for users table
CREATE POLICY "Users can view their merchant's users" ON public.users
FOR SELECT USING (merchant_id = public.get_current_user_merchant_id());

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_merchant_id ON public.profiles(merchant_id);
CREATE INDEX IF NOT EXISTS idx_returns_merchant_id ON public.returns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_return_id ON public.ai_suggestions(return_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_merchant_id ON public.analytics_events(merchant_id);
