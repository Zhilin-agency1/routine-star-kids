-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('parent', 'child');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'ru' CHECK (language_preference IN ('ru', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Моя семья',
  timezone TEXT DEFAULT 'Europe/Moscow',
  default_language TEXT DEFAULT 'ru' CHECK (default_language IN ('ru', 'en')),
  currency_name TEXT DEFAULT 'Coins',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '🦁',
  language_preference TEXT DEFAULT 'ru' CHECK (language_preference IN ('ru', 'en')),
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task_templates table
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT,
  description_en TEXT,
  icon TEXT DEFAULT '✨',
  reward_amount INTEGER NOT NULL DEFAULT 5,
  task_type TEXT NOT NULL DEFAULT 'one_time' CHECK (task_type IN ('one_time', 'recurring')),
  one_time_date DATE,
  recurring_rule TEXT CHECK (recurring_rule IN ('daily', 'weekly', 'monthly')),
  recurring_days INTEGER[] DEFAULT '{}',
  recurring_time TIME DEFAULT '09:00',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task_instances table
CREATE TABLE public.task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.task_templates(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  due_datetime TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL DEFAULT 'todo' CHECK (state IN ('todo', 'doing', 'done', 'skipped', 'cancelled')),
  completed_at TIMESTAMPTZ,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  cancellation_scope TEXT CHECK (cancellation_scope IN ('this_only', 'this_and_future')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'adjust', 'spend', 'refund')),
  amount INTEGER NOT NULL,
  source TEXT CHECK (source IN ('task_instance', 'manual', 'store_purchase', 'job_claim')),
  source_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create store_items table
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ru TEXT,
  description_en TEXT,
  price INTEGER NOT NULL,
  image_url TEXT DEFAULT '🎁',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  store_item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  price_at_purchase INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_board_items table
CREATE TABLE public.job_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT,
  description_en TEXT,
  icon TEXT DEFAULT '💼',
  reward_amount INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  availability TEXT DEFAULT 'always' CHECK (availability IN ('always', 'once', 'limited')),
  available_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_claims table
CREATE TABLE public.job_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_board_item_id UUID REFERENCES public.job_board_items(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'done', 'cancelled')),
  linked_task_instance_id UUID REFERENCES public.task_instances(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity_schedules table
CREATE TABLE public.activity_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  location TEXT,
  recurring_rule TEXT DEFAULT 'weekly' CHECK (recurring_rule IN ('daily', 'weekly', 'monthly')),
  recurring_days INTEGER[] DEFAULT '{}',
  time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_schedules ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is family owner
CREATE OR REPLACE FUNCTION public.is_family_owner(_user_id UUID, _family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.families
    WHERE id = _family_id AND owner_user_id = _user_id
  )
$$;

-- Create security definer function to check if user is linked child in family
CREATE OR REPLACE FUNCTION public.is_child_in_family(_user_id UUID, _family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children
    WHERE family_id = _family_id AND linked_user_id = _user_id
  )
$$;

-- Create security definer function to get user's family id (as owner)
CREATE OR REPLACE FUNCTION public.get_user_family_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.families WHERE owner_user_id = _user_id LIMIT 1
$$;

-- Create security definer function to get child's family id by linked user
CREATE OR REPLACE FUNCTION public.get_child_family_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.children WHERE linked_user_id = _user_id LIMIT 1
$$;

-- Create function to check family membership (owner or child)
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id UUID, _family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_family_owner(_user_id, _family_id) OR public.is_child_in_family(_user_id, _family_id)
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for families
CREATE POLICY "Family owners can view their families"
ON public.families FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Family owners can update their families"
ON public.families FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create families"
ON public.families FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Family owners can delete their families"
ON public.families FOR DELETE
USING (auth.uid() = owner_user_id);

-- RLS Policies for children
CREATE POLICY "Family owners can view children"
ON public.children FOR SELECT
USING (public.is_family_owner(auth.uid(), family_id));

CREATE POLICY "Linked children can view themselves"
ON public.children FOR SELECT
USING (auth.uid() = linked_user_id);

CREATE POLICY "Family owners can manage children"
ON public.children FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- RLS Policies for task_templates
CREATE POLICY "Family members can view task templates"
ON public.task_templates FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage task templates"
ON public.task_templates FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- RLS Policies for task_instances
CREATE POLICY "Family members can view task instances"
ON public.task_instances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.task_templates tt
    WHERE tt.id = template_id AND public.is_family_member(auth.uid(), tt.family_id)
  )
);

CREATE POLICY "Family owners can manage task instances"
ON public.task_instances FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.task_templates tt
    WHERE tt.id = template_id AND public.is_family_owner(auth.uid(), tt.family_id)
  )
);

CREATE POLICY "Children can update their own task instances"
ON public.task_instances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = child_id AND c.linked_user_id = auth.uid()
  )
);

-- RLS Policies for transactions
CREATE POLICY "Family members can view transactions"
ON public.transactions FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage transactions"
ON public.transactions FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- RLS Policies for store_items
CREATE POLICY "Family members can view store items"
ON public.store_items FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage store items"
ON public.store_items FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- RLS Policies for purchases
CREATE POLICY "Family members can view purchases"
ON public.purchases FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage purchases"
ON public.purchases FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

CREATE POLICY "Children can create purchases"
ON public.purchases FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = child_id AND c.linked_user_id = auth.uid()
  )
);

-- RLS Policies for job_board_items
CREATE POLICY "Family members can view job board items"
ON public.job_board_items FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage job board items"
ON public.job_board_items FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- RLS Policies for job_claims
CREATE POLICY "Family members can view job claims"
ON public.job_claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_board_items jbi
    WHERE jbi.id = job_board_item_id AND public.is_family_member(auth.uid(), jbi.family_id)
  )
);

CREATE POLICY "Children can create job claims"
ON public.job_claims FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = child_id AND c.linked_user_id = auth.uid()
  )
);

CREATE POLICY "Family owners can manage job claims"
ON public.job_claims FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.job_board_items jbi
    WHERE jbi.id = job_board_item_id AND public.is_family_owner(auth.uid(), jbi.family_id)
  )
);

-- RLS Policies for activity_schedules
CREATE POLICY "Family members can view activity schedules"
ON public.activity_schedules FOR SELECT
USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage activity schedules"
ON public.activity_schedules FOR ALL
USING (public.is_family_owner(auth.uid(), family_id));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_instances_updated_at
  BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_board_items_updated_at
  BEFORE UPDATE ON public.job_board_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_claims_updated_at
  BEFORE UPDATE ON public.job_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_schedules_updated_at
  BEFORE UPDATE ON public.activity_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  -- Auto-assign parent role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'parent');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_children_family_id ON public.children(family_id);
CREATE INDEX idx_children_linked_user_id ON public.children(linked_user_id);
CREATE INDEX idx_task_templates_family_id ON public.task_templates(family_id);
CREATE INDEX idx_task_templates_child_id ON public.task_templates(child_id);
CREATE INDEX idx_task_instances_template_id ON public.task_instances(template_id);
CREATE INDEX idx_task_instances_child_id ON public.task_instances(child_id);
CREATE INDEX idx_task_instances_due_datetime ON public.task_instances(due_datetime);
CREATE INDEX idx_task_instances_state ON public.task_instances(state);
CREATE INDEX idx_transactions_family_id ON public.transactions(family_id);
CREATE INDEX idx_transactions_child_id ON public.transactions(child_id);
CREATE INDEX idx_store_items_family_id ON public.store_items(family_id);
CREATE INDEX idx_purchases_family_id ON public.purchases(family_id);
CREATE INDEX idx_purchases_child_id ON public.purchases(child_id);
CREATE INDEX idx_job_board_items_family_id ON public.job_board_items(family_id);
CREATE INDEX idx_job_claims_job_board_item_id ON public.job_claims(job_board_item_id);
CREATE INDEX idx_job_claims_child_id ON public.job_claims(child_id);
CREATE INDEX idx_activity_schedules_family_id ON public.activity_schedules(family_id);
CREATE INDEX idx_activity_schedules_child_id ON public.activity_schedules(child_id);