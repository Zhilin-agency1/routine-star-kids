-- =====================================================
-- PART 1: Database constraints for input validation (defense in depth)
-- =====================================================

-- Children table constraints
ALTER TABLE public.children 
  ADD CONSTRAINT children_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.children 
  ADD CONSTRAINT children_balance_range CHECK (balance >= -1000000 AND balance <= 10000000);

-- Task templates constraints
ALTER TABLE public.task_templates 
  ADD CONSTRAINT task_templates_title_length CHECK (char_length(title_ru) <= 200 AND char_length(title_en) <= 200);

ALTER TABLE public.task_templates 
  ADD CONSTRAINT task_templates_description_length CHECK (char_length(COALESCE(description_ru, '')) <= 1000 AND char_length(COALESCE(description_en, '')) <= 1000);

ALTER TABLE public.task_templates 
  ADD CONSTRAINT task_templates_reward_range CHECK (reward_amount >= 0 AND reward_amount <= 10000);

-- Store items constraints
ALTER TABLE public.store_items 
  ADD CONSTRAINT store_items_name_length CHECK (char_length(name_ru) <= 200 AND char_length(name_en) <= 200);

ALTER TABLE public.store_items 
  ADD CONSTRAINT store_items_price_range CHECK (price >= 1 AND price <= 1000000);

-- Job board items constraints  
ALTER TABLE public.job_board_items 
  ADD CONSTRAINT job_board_items_title_length CHECK (char_length(title_ru) <= 200 AND char_length(title_en) <= 200);

ALTER TABLE public.job_board_items 
  ADD CONSTRAINT job_board_items_description_length CHECK (char_length(COALESCE(description_ru, '')) <= 1000 AND char_length(COALESCE(description_en, '')) <= 1000);

ALTER TABLE public.job_board_items 
  ADD CONSTRAINT job_board_items_reward_range CHECK (reward_amount >= 0 AND reward_amount <= 10000);

-- Activity schedules constraints
ALTER TABLE public.activity_schedules 
  ADD CONSTRAINT activity_schedules_title_length CHECK (char_length(title_ru) <= 200 AND char_length(title_en) <= 200);

ALTER TABLE public.activity_schedules 
  ADD CONSTRAINT activity_schedules_location_length CHECK (char_length(COALESCE(location, '')) <= 500);

ALTER TABLE public.activity_schedules 
  ADD CONSTRAINT activity_schedules_duration_range CHECK (duration >= 5 AND duration <= 1440);

-- Transactions constraints
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_note_length CHECK (char_length(COALESCE(note, '')) <= 500);

-- Task steps constraints
ALTER TABLE public.task_steps 
  ADD CONSTRAINT task_steps_title_length CHECK (char_length(title_ru) <= 200 AND char_length(title_en) <= 200);

ALTER TABLE public.task_steps 
  ADD CONSTRAINT task_steps_bonus_range CHECK (COALESCE(bonus_amount, 0) >= 0 AND COALESCE(bonus_amount, 0) <= 10000);

-- =====================================================
-- PART 2: Atomic balance operation functions (race condition fix)
-- =====================================================

-- Function to complete a task atomically
CREATE OR REPLACE FUNCTION public.complete_task_with_reward(
  p_instance_id UUID,
  p_child_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_reward INTEGER;
  v_family_id UUID;
  v_current_state TEXT;
  v_reward_granted BOOLEAN;
BEGIN
  -- Get task instance details with lock
  SELECT ti.state, ti.reward_granted, tt.reward_amount, tt.family_id 
  INTO v_current_state, v_reward_granted, v_reward, v_family_id
  FROM task_instances ti
  JOIN task_templates tt ON ti.template_id = tt.id
  WHERE ti.id = p_instance_id AND ti.child_id = p_child_id
  FOR UPDATE;

  -- Validate state
  IF v_current_state IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Task instance not found');
  END IF;

  IF v_current_state = 'done' THEN
    RETURN json_build_object('success', false, 'error', 'Task already completed');
  END IF;

  IF v_reward_granted THEN
    RETURN json_build_object('success', false, 'error', 'Reward already granted');
  END IF;

  -- Update task instance
  UPDATE task_instances
  SET state = 'done', completed_at = now(), reward_granted = true, updated_at = now()
  WHERE id = p_instance_id;

  -- Update child balance
  UPDATE children
  SET balance = balance + v_reward, updated_at = now()
  WHERE id = p_child_id;

  -- Create transaction record
  INSERT INTO transactions (family_id, child_id, transaction_type, amount, source, source_id)
  VALUES (v_family_id, p_child_id, 'earn', v_reward, 'task_instance', p_instance_id);

  RETURN json_build_object('success', true, 'reward', v_reward);
END;
$$;

-- Function to uncomplete a task atomically
CREATE OR REPLACE FUNCTION public.uncomplete_task_with_refund(
  p_instance_id UUID,
  p_child_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_reward INTEGER;
  v_family_id UUID;
  v_current_state TEXT;
  v_reward_granted BOOLEAN;
BEGIN
  -- Get task instance details with lock
  SELECT ti.state, ti.reward_granted, tt.reward_amount, tt.family_id 
  INTO v_current_state, v_reward_granted, v_reward, v_family_id
  FROM task_instances ti
  JOIN task_templates tt ON ti.template_id = tt.id
  WHERE ti.id = p_instance_id AND ti.child_id = p_child_id
  FOR UPDATE;

  -- Validate state
  IF v_current_state IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Task instance not found');
  END IF;

  IF v_current_state != 'done' THEN
    RETURN json_build_object('success', false, 'error', 'Task not completed');
  END IF;

  -- Update task instance
  UPDATE task_instances
  SET state = 'todo', completed_at = NULL, reward_granted = false, updated_at = now()
  WHERE id = p_instance_id;

  -- Only refund if reward was granted
  IF v_reward_granted THEN
    -- Update child balance
    UPDATE children
    SET balance = balance - v_reward, updated_at = now()
    WHERE id = p_child_id;

    -- Create reversal transaction record
    INSERT INTO transactions (family_id, child_id, transaction_type, amount, source, source_id, note)
    VALUES (v_family_id, p_child_id, 'adjustment', -v_reward, 'task_instance', p_instance_id, 'Отмена выполнения задачи');
  END IF;

  RETURN json_build_object('success', true, 'refunded', v_reward_granted, 'amount', v_reward);
END;
$$;

-- Function to complete a job claim atomically
CREATE OR REPLACE FUNCTION public.complete_job_claim_with_reward(
  p_claim_id UUID,
  p_child_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_reward INTEGER;
  v_family_id UUID;
  v_current_status TEXT;
  v_job_title TEXT;
BEGIN
  -- Get job claim details with lock
  SELECT jc.status, jbi.reward_amount, jbi.family_id, jbi.title_ru
  INTO v_current_status, v_reward, v_family_id, v_job_title
  FROM job_claims jc
  JOIN job_board_items jbi ON jc.job_board_item_id = jbi.id
  WHERE jc.id = p_claim_id AND jc.child_id = p_child_id
  FOR UPDATE;

  -- Validate state
  IF v_current_status IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Job claim not found');
  END IF;

  IF v_current_status = 'done' THEN
    RETURN json_build_object('success', false, 'error', 'Job already completed');
  END IF;

  -- Update job claim status
  UPDATE job_claims
  SET status = 'done', updated_at = now()
  WHERE id = p_claim_id;

  -- Update child balance
  UPDATE children
  SET balance = balance + v_reward, updated_at = now()
  WHERE id = p_child_id;

  -- Create transaction record
  INSERT INTO transactions (family_id, child_id, transaction_type, amount, source, source_id, note)
  VALUES (v_family_id, p_child_id, 'earn', v_reward, 'job_claim', p_claim_id, 'Выполнена работа: ' || v_job_title);

  RETURN json_build_object('success', true, 'reward', v_reward);
END;
$$;

-- Function to purchase store item atomically
CREATE OR REPLACE FUNCTION public.purchase_store_item(
  p_item_id UUID,
  p_child_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_price INTEGER;
  v_family_id UUID;
  v_child_balance INTEGER;
  v_item_name TEXT;
  v_item_active BOOLEAN;
  v_purchase_id UUID;
BEGIN
  -- Get store item details
  SELECT si.price, si.family_id, si.name_ru, si.active
  INTO v_price, v_family_id, v_item_name, v_item_active
  FROM store_items si
  WHERE si.id = p_item_id;

  IF v_price IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Item not found');
  END IF;

  IF NOT v_item_active THEN
    RETURN json_build_object('success', false, 'error', 'Item not available');
  END IF;

  -- Get child balance with lock
  SELECT balance INTO v_child_balance
  FROM children
  WHERE id = p_child_id AND family_id = v_family_id
  FOR UPDATE;

  IF v_child_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Child not found');
  END IF;

  IF v_child_balance < v_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_child_balance, 'price', v_price);
  END IF;

  -- Create purchase record
  INSERT INTO purchases (family_id, child_id, store_item_id, price_at_purchase, status)
  VALUES (v_family_id, p_child_id, p_item_id, v_price, 'requested')
  RETURNING id INTO v_purchase_id;

  -- Update child balance
  UPDATE children
  SET balance = balance - v_price, updated_at = now()
  WHERE id = p_child_id;

  -- Create transaction record
  INSERT INTO transactions (family_id, child_id, transaction_type, amount, source, source_id, note)
  VALUES (v_family_id, p_child_id, 'spend', -v_price, 'purchase', v_purchase_id, 'Покупка: ' || v_item_name);

  RETURN json_build_object('success', true, 'purchase_id', v_purchase_id, 'price', v_price);
END;
$$;

-- Function to adjust child balance atomically
CREATE OR REPLACE FUNCTION public.adjust_child_balance(
  p_child_id UUID,
  p_amount INTEGER,
  p_note TEXT DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_family_id UUID;
  v_new_balance INTEGER;
  v_transaction_type TEXT;
BEGIN
  -- Get child with lock
  SELECT family_id INTO v_family_id
  FROM children
  WHERE id = p_child_id
  FOR UPDATE;

  IF v_family_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Child not found');
  END IF;

  -- Determine transaction type
  v_transaction_type := CASE WHEN p_amount >= 0 THEN 'earn' ELSE 'spend' END;

  -- Update child balance
  UPDATE children
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = p_child_id
  RETURNING balance INTO v_new_balance;

  -- Create transaction record
  INSERT INTO transactions (family_id, child_id, transaction_type, amount, source, note)
  VALUES (v_family_id, p_child_id, v_transaction_type, p_amount, 'manual', COALESCE(p_note, 'Ручная корректировка'));

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;