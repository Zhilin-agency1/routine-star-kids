-- Add routine_type column to distinguish morning vs evening routines
ALTER TABLE public.task_templates
ADD COLUMN routine_type text DEFAULT NULL CHECK (routine_type IN ('morning', 'evening'));

-- Add comment for clarity
COMMENT ON COLUMN public.task_templates.routine_type IS 'For routine tasks only: morning or evening. NULL for activities.';