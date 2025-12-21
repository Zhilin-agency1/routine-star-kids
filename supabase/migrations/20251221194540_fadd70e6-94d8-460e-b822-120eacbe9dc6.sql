-- Add task_category column to distinguish between routine tasks and activities
ALTER TABLE public.task_templates
ADD COLUMN task_category text NOT NULL DEFAULT 'routine';

-- Add comment for clarity
COMMENT ON COLUMN public.task_templates.task_category IS 'Category of the task: routine (regular tasks) or activity (classes/activities that also appear in schedule)';