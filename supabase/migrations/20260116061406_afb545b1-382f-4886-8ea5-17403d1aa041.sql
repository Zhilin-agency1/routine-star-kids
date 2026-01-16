-- Allow pending invites without a user_id
ALTER TABLE public.family_members
  ALTER COLUMN user_id DROP NOT NULL;

-- Replace the hard unique constraint with a partial unique index
ALTER TABLE public.family_members
  DROP CONSTRAINT IF EXISTS family_members_family_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS family_members_unique_accepted
  ON public.family_members (family_id, user_id)
  WHERE invite_status = 'accepted' AND user_id IS NOT NULL;

-- Speed up invite token lookup
CREATE INDEX IF NOT EXISTS family_members_invite_token_idx
  ON public.family_members (invite_token);

-- Accept an invite token and attach it to the current authenticated user
CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token uuid)
RETURNS TABLE (family_id uuid, permission_level text, role_label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.family_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
    INTO v_invite
  FROM public.family_members
  WHERE invite_token = p_token
    AND invite_status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- If already a member, invalidate the token row and return
  IF EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = v_invite.family_id
      AND user_id = auth.uid()
      AND invite_status = 'accepted'
  ) THEN
    UPDATE public.family_members
      SET invite_status = 'declined',
          invite_token = NULL,
          updated_at = now()
    WHERE id = v_invite.id;

    RETURN QUERY
      SELECT v_invite.family_id, v_invite.permission_level, v_invite.role_label;
    RETURN;
  END IF;

  UPDATE public.family_members
    SET user_id = auth.uid(),
        invite_status = 'accepted',
        invite_token = NULL,
        updated_at = now()
  WHERE id = v_invite.id;

  RETURN QUERY
    SELECT v_invite.family_id, v_invite.permission_level, v_invite.role_label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_family_invite(uuid) TO authenticated;
