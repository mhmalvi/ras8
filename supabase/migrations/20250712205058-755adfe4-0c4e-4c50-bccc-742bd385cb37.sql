
-- Allow unauthenticated profile creation for master admin email specifically
CREATE POLICY "Allow master admin profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (email = 'aalvi.hm@gmail.com');

-- Update the existing policy to also allow master admin role
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id OR email = 'aalvi.hm@gmail.com');
