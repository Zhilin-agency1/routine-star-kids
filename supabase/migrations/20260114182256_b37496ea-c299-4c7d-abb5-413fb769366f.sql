-- Create a public view without sensitive fields (invite_email, invite_token)
CREATE VIEW public.family_members_public
WITH (security_invoker=on) AS
SELECT 
  id,
  family_id,
  user_id,
  invited_by,
  created_at,
  updated_at,
  role_label,
  permission_level,
  invite_status
FROM public.family_members;

-- Drop the existing policy that exposes sensitive data
DROP POLICY IF EXISTS "Members can view their own membership" ON public.family_members;

-- Create a new, more restrictive SELECT policy
-- Users can only view their own membership record (not pending invitations for others)
CREATE POLICY "Members can view their own membership record only"
ON public.family_members
FOR SELECT
USING (user_id = auth.uid());

-- Family owners can view all members including pending invitations (they need to manage invites)
CREATE POLICY "Family owners can view all family members"
ON public.family_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = family_members.family_id AND f.owner_user_id = auth.uid()
  )
);

-- Add comment explaining the security pattern
COMMENT ON VIEW public.family_members_public IS 'Public view of family_members without sensitive fields (invite_email, invite_token). Use this view in application code for regular queries.';