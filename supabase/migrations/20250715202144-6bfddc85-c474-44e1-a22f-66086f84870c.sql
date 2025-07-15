-- Update the master admin profile to have the correct role
UPDATE public.profiles 
SET role = 'master_admin' 
WHERE email = 'aalvi.hm@gmail.com';