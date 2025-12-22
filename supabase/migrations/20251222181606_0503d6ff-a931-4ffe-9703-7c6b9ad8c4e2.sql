-- Create function to refund step bonus on completion deletion
CREATE OR REPLACE FUNCTION public.refund_step_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_child_id uuid;
  v_family_id uuid;
  v_bonus_amount integer;
  v_step_title_ru text;
BEGIN
  -- Get step bonus amount and task instance details
  SELECT 
    ti.child_id,
    tt.family_id,
    COALESCE(ts.bonus_amount, 0),
    ts.title_ru
  INTO 
    v_child_id,
    v_family_id,
    v_bonus_amount,
    v_step_title_ru
  FROM task_instances ti
  JOIN task_templates tt ON tt.id = ti.template_id
  JOIN task_steps ts ON ts.id = OLD.step_id
  WHERE ti.id = OLD.task_instance_id;

  -- Only proceed if there was a bonus to refund
  IF v_bonus_amount > 0 THEN
    -- Subtract from child balance
    UPDATE public.children
    SET balance = balance - v_bonus_amount
    WHERE id = v_child_id;

    -- Create refund transaction record
    INSERT INTO public.transactions (
      family_id,
      child_id,
      amount,
      transaction_type,
      source,
      source_id,
      note
    ) VALUES (
      v_family_id,
      v_child_id,
      -v_bonus_amount,
      'adjustment',
      'step_bonus_refund',
      OLD.step_id,
      'Отмена шага: ' || v_step_title_ru
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for step bonus refund
CREATE TRIGGER on_step_completion_delete_refund_bonus
  BEFORE DELETE ON public.task_step_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_step_bonus();