-- Fix missing RLS policies for security

-- 1. Add DELETE policy for profiles (users can only delete their own profile)
-- Note: This is restrictive - users should not normally delete their profiles
-- but if allowed, it should only be their own
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Ensure user_roles cannot be modified by anyone except system
-- The table already blocks INSERT/UPDATE/DELETE by default (no policies = deny all)
-- This is correct behavior - only the handle_new_user trigger should insert roles
-- Add explicit restrictive policies to make this clear

-- No additional policies needed for user_roles INSERT/UPDATE/DELETE
-- The absence of policies means these operations are denied by default
-- Only the SECURITY DEFINER trigger can insert roles

-- 3. Add DELETE policy for notifications (family owners can delete)
DROP POLICY IF EXISTS "Family owners can delete notifications" ON public.notifications;
CREATE POLICY "Family owners can delete notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (is_family_owner(auth.uid(), family_id) AND recipient_type = 'parent');

-- 4. Template events should be immutable (audit log)
-- Add explicit deny policies for UPDATE and DELETE
-- Since there are no UPDATE/DELETE policies, operations are already denied
-- This is correct behavior for an audit log table

-- 5. Children table - the ALL policy for family owners already covers DELETE
-- No changes needed - family owners can manage (including delete) children
-- Linked children can only SELECT themselves, which is correct