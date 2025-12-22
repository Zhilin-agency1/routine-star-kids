-- Add end_time column to task_templates for time interval support
ALTER TABLE public.task_templates 
ADD COLUMN end_time time without time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.task_templates.end_time IS 'End time for task duration (optional). recurring_time serves as start time.';
COMMENT ON COLUMN public.task_templates.recurring_time IS 'Start time for task execution.';