-- Drop the existing SELECT policy that doesn't require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new SELECT policy that requires authentication AND restricts to own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);