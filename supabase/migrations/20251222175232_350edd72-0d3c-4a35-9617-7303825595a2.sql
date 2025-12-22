-- Create function to grant step bonus
CREATE OR REPLACE FUNCTION public.grant_step_bonus()
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
  v_step_title_en text;
BEGIN
  -- Get step bonus amount and task instance details
  SELECT 
    ti.child_id,
    tt.family_id,
    COALESCE(ts.bonus_amount, 0),
    ts.title_ru,
    ts.title_en
  INTO 
    v_child_id,
    v_family_id,
    v_bonus_amount,
    v_step_title_ru,
    v_step_title_en
  FROM task_instances ti
  JOIN task_templates tt ON tt.id = ti.template_id
  JOIN task_steps ts ON ts.id = NEW.step_id
  WHERE ti.id = NEW.task_instance_id;

  -- Only proceed if there's a bonus to grant
  IF v_bonus_amount > 0 THEN
    -- Update child balance
    UPDATE public.children
    SET balance = balance + v_bonus_amount
    WHERE id = v_child_id;

    -- Create transaction record
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
      v_bonus_amount,
      'earn',
      'step_bonus',
      NEW.step_id,
      'Бонус за шаг: ' || v_step_title_ru
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for step bonus
CREATE TRIGGER on_step_completion_grant_bonus
  AFTER INSERT ON public.task_step_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_step_bonus();