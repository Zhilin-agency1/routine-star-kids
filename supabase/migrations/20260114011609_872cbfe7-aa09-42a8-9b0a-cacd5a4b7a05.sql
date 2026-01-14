-- Drop the trigger that creates notifications on step completion
DROP TRIGGER IF EXISTS on_step_completion_notify ON public.task_step_completions;

-- We keep the notify_step_completion function but it won't be called anymore
-- The notifications table is kept for data integrity but won't receive new entries