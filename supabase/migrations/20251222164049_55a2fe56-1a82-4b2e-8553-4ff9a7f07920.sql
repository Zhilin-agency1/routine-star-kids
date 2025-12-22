-- Add bonus and due date columns to task_steps
ALTER TABLE public.task_steps 
ADD COLUMN due_date date DEFAULT NULL,
ADD COLUMN bonus_amount integer DEFAULT 0,
ADD COLUMN bonus_hidden boolean DEFAULT false;