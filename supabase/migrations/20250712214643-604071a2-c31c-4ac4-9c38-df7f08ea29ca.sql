
-- First, let's check if the master admin profile already exists
-- If not, we'll create it manually with the correct setup

-- Insert the master admin profile directly into the profiles table
-- This will work because we have a policy that allows master admin profile creation
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'aalvi.hm@gmail.com',
  'Master',
  'Admin',
  'master_admin'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'master_admin',
  first_name = 'Master',
  last_name = 'Admin';
