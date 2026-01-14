-- Add assignee_parent_id column for parent activities
-- When this is set and child_id is NULL, the task is for a parent
ALTER TABLE public.task_templates 
ADD COLUMN assignee_parent_id UUID NULL;

-- Add comment explaining the usage
COMMENT ON COLUMN public.task_templates.assignee_parent_id IS 
  'When set, indicates this task is assigned to a parent (adult). child_id should be NULL. The value references auth.users.id of the parent.';

-- Add index for efficient filtering
CREATE INDEX idx_task_templates_assignee_parent 
ON public.task_templates(assignee_parent_id) 
WHERE assignee_parent_id IS NOT NULL;