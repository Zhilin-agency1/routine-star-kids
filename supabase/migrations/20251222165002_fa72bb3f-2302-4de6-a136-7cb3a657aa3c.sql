-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  recipient_type text NOT NULL DEFAULT 'parent', -- 'parent' or 'child'
  recipient_child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'step_completed', 'task_completed', 'purchase_requested', etc.
  title_ru text NOT NULL,
  title_en text NOT NULL,
  message_ru text,
  message_en text,
  data jsonb DEFAULT '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Parents can view notifications for their family
CREATE POLICY "Family owners can view notifications"
ON public.notifications
FOR SELECT
USING (is_family_owner(auth.uid(), family_id) AND recipient_type = 'parent');

-- Parents can update (mark as read) their notifications
CREATE POLICY "Family owners can update notifications"
ON public.notifications
FOR UPDATE
USING (is_family_owner(auth.uid(), family_id) AND recipient_type = 'parent');

-- Allow inserting notifications (for triggers/app logic)
CREATE POLICY "Allow insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_family_member(auth.uid(), family_id));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify parent when step is completed
CREATE OR REPLACE FUNCTION public.notify_step_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
  v_child_name text;
  v_step_title_ru text;
  v_step_title_en text;
  v_task_title_ru text;
  v_task_title_en text;
  v_step_bonus integer;
BEGIN
  -- Get task instance details
  SELECT 
    tt.family_id,
    c.name,
    ts.title_ru,
    ts.title_en,
    tt.title_ru,
    tt.title_en,
    ts.bonus_amount
  INTO 
    v_family_id,
    v_child_name,
    v_step_title_ru,
    v_step_title_en,
    v_task_title_ru,
    v_task_title_en,
    v_step_bonus
  FROM task_instances ti
  JOIN task_templates tt ON tt.id = ti.template_id
  JOIN children c ON c.id = ti.child_id
  JOIN task_steps ts ON ts.id = NEW.step_id
  WHERE ti.id = NEW.task_instance_id;

  -- Insert notification for parent
  INSERT INTO public.notifications (
    family_id,
    recipient_type,
    type,
    title_ru,
    title_en,
    message_ru,
    message_en,
    data
  ) VALUES (
    v_family_id,
    'parent',
    'step_completed',
    v_child_name || ' выполнил шаг',
    v_child_name || ' completed a step',
    '«' || v_step_title_ru || '» в задаче «' || v_task_title_ru || '»',
    '"' || v_step_title_en || '" in task "' || v_task_title_en || '"',
    jsonb_build_object(
      'child_name', v_child_name,
      'step_title_ru', v_step_title_ru,
      'step_title_en', v_step_title_en,
      'task_title_ru', v_task_title_ru,
      'task_title_en', v_task_title_en,
      'bonus_amount', v_step_bonus,
      'task_instance_id', NEW.task_instance_id,
      'step_id', NEW.step_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for step completion
CREATE TRIGGER on_step_completion
AFTER INSERT ON public.task_step_completions
FOR EACH ROW
EXECUTE FUNCTION public.notify_step_completion();