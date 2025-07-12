
-- Fix the profiles table role column to properly handle master_admin role
DO $$ 
BEGIN
    -- First ensure the user_role enum exists with master_admin
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'merchant', 'master_admin');
    ELSE
        -- Check if master_admin exists in the enum, if not add it
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'master_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
            ALTER TYPE user_role ADD VALUE 'master_admin';
        END IF;
    END IF;
END $$;

-- Update the profiles table role column to use the enum properly
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'admin'::user_role;

-- Update the handle_new_user function to properly handle master admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Determine the role based on email
  DECLARE
    user_role_value user_role := 'admin'::user_role;
  BEGIN
    -- Set master_admin role for the specific email
    IF NEW.email = 'aalvi.hm@gmail.com' THEN
      user_role_value := 'master_admin'::user_role;
    END IF;
    
    -- Insert or update the profile
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      user_role_value
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      updated_at = NOW();
    
    RETURN NEW;
  END;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing master admin profile if it exists
UPDATE public.profiles 
SET 
  role = 'master_admin'::user_role,
  updated_at = NOW()
WHERE email = 'aalvi.hm@gmail.com';

-- Also ensure RLS policies allow master admin operations
CREATE POLICY IF NOT EXISTS "Master admin full access" 
ON public.profiles 
FOR ALL 
USING (auth.jwt() ->> 'email' = 'aalvi.hm@gmail.com' OR role = 'master_admin'::user_role)
WITH CHECK (auth.jwt() ->> 'email' = 'aalvi.hm@gmail.com' OR role = 'master_admin'::user_role);
