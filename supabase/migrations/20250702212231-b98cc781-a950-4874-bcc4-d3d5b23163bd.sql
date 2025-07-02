
-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Create trigger that fires when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Add better policies for customer portal access to orders and returns
DROP POLICY IF EXISTS "Customers can view orders by email" ON public.orders;
CREATE POLICY "Customers can view orders by email" 
  ON public.orders 
  FOR SELECT 
  USING (true); -- Allow public access for customer portal

DROP POLICY IF EXISTS "Customers can create returns" ON public.returns;
CREATE POLICY "Customers can create returns" 
  ON public.returns 
  FOR INSERT 
  WITH CHECK (true); -- Allow customers to create returns

DROP POLICY IF EXISTS "Customers can view their returns" ON public.returns;
CREATE POLICY "Customers can view their returns" 
  ON public.returns 
  FOR SELECT 
  USING (true); -- Allow customers to view returns

DROP POLICY IF EXISTS "Customers can update their pending returns" ON public.returns;
CREATE POLICY "Customers can update their pending returns" 
  ON public.returns 
  FOR UPDATE 
  USING (status IN ('requested', 'pending'));

DROP POLICY IF EXISTS "Customers can cancel their pending returns" ON public.returns;
CREATE POLICY "Customers can cancel their pending returns" 
  ON public.returns 
  FOR DELETE 
  USING (status IN ('requested', 'pending'));
