-- Create table for task steps (checklist items for templates)
CREATE TABLE public.task_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking step completions per task instance
CREATE TABLE public.task_step_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_instance_id UUID NOT NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.task_steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_instance_id, step_id)
);

-- Enable RLS
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_step_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_steps
CREATE POLICY "Family members can view task steps"
ON public.task_steps
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM task_templates tt 
  WHERE tt.id = task_steps.template_id 
  AND is_family_member(auth.uid(), tt.family_id)
));

CREATE POLICY "Family owners can manage task steps"
ON public.task_steps
FOR ALL
USING (EXISTS (
  SELECT 1 FROM task_templates tt 
  WHERE tt.id = task_steps.template_id 
  AND is_family_owner(auth.uid(), tt.family_id)
));

-- RLS policies for task_step_completions
CREATE POLICY "Family members can view step completions"
ON public.task_step_completions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM task_instances ti
  JOIN task_templates tt ON tt.id = ti.template_id
  WHERE ti.id = task_step_completions.task_instance_id
  AND is_family_member(auth.uid(), tt.family_id)
));

CREATE POLICY "Family owners can manage step completions"
ON public.task_step_completions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM task_instances ti
  JOIN task_templates tt ON tt.id = ti.template_id
  WHERE ti.id = task_step_completions.task_instance_id
  AND is_family_owner(auth.uid(), tt.family_id)
));

CREATE POLICY "Children can complete their own steps"
ON public.task_step_completions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM task_instances ti
  JOIN children c ON c.id = ti.child_id
  WHERE ti.id = task_step_completions.task_instance_id
  AND c.linked_user_id = auth.uid()
));

CREATE POLICY "Children can delete their own step completions"
ON public.task_step_completions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM task_instances ti
  JOIN children c ON c.id = ti.child_id
  WHERE ti.id = task_step_completions.task_instance_id
  AND c.linked_user_id = auth.uid()
));

-- Add index for performance
CREATE INDEX idx_task_steps_template_id ON public.task_steps(template_id);
CREATE INDEX idx_task_step_completions_instance_id ON public.task_step_completions(task_instance_id);