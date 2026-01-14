-- Create family_members table for parent invites
CREATE TABLE public.family_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_label text NOT NULL DEFAULT 'Parent',
    permission_level text NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'admin')),
    invited_by uuid REFERENCES auth.users(id),
    invite_email text,
    invite_token uuid,
    invite_status text NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'declined')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (family_id, user_id)
);

-- Add allow_parent_activities column to families table for the toggle
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS allow_parent_activities boolean NOT NULL DEFAULT false;

-- Enable RLS on family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_members
CREATE POLICY "Family owners can manage members"
ON public.family_members
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = family_members.family_id 
    AND f.owner_user_id = auth.uid()
));

CREATE POLICY "Members can view their own membership"
ON public.family_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin members can manage family"
ON public.family_members
FOR ALL
USING (
    permission_level = 'admin' 
    AND user_id = auth.uid()
);

-- Create index for faster lookups
CREATE INDEX idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_family_members_invite_token ON public.family_members(invite_token) WHERE invite_token IS NOT NULL;

-- Update updated_at trigger
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();