-- Add duration field for step execution time
ALTER TABLE public.task_steps 
ADD COLUMN duration_minutes INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.task_steps.duration_minutes IS 'Estimated time to complete the step in minutes';