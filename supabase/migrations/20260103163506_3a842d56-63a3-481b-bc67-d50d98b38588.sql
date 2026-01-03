-- Create template_events table for logging template applications
CREATE TABLE public.template_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.day_templates(id) ON DELETE SET NULL,
  preset_key TEXT,
  template_name TEXT NOT NULL,
  apply_mode TEXT NOT NULL CHECK (apply_mode IN ('replace', 'add')),
  apply_scope TEXT NOT NULL CHECK (apply_scope IN ('one_time', 'recurring')),
  target_date DATE NOT NULL,
  children_count INTEGER NOT NULL DEFAULT 1,
  tasks_created_count INTEGER NOT NULL DEFAULT 0,
  tasks_skipped_duplicates_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Family owners can view template events"
ON public.template_events
FOR SELECT
USING (is_family_owner(auth.uid(), family_id));

CREATE POLICY "Family owners can insert template events"
ON public.template_events
FOR INSERT
WITH CHECK (is_family_owner(auth.uid(), family_id));

-- Create index for faster queries
CREATE INDEX idx_template_events_family_id ON public.template_events(family_id);
CREATE INDEX idx_template_events_created_at ON public.template_events(created_at DESC);