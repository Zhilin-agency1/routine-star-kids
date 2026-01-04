-- Remove email column from profiles table (email should only be in auth.users)
-- This is a security fix to prevent PII exposure

-- Drop the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user() function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  -- Auto-assign parent role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'parent');
  
  RETURN new;
END;
$$;