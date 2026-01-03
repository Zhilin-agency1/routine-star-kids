-- Create day_templates table for storing reusable day plans
CREATE TABLE public.day_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  preset_key TEXT, -- For preset templates: 'school_morning', 'after_school', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create day_template_tasks table for tasks within a template
CREATE TABLE public.day_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_template_id UUID REFERENCES public.day_templates(id) ON DELETE CASCADE NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT,
  description_en TEXT,
  icon TEXT DEFAULT '✨',
  reward_amount INTEGER NOT NULL DEFAULT 5,
  time TEXT, -- e.g., '09:00' for ordering/display
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.day_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for day_templates
CREATE POLICY "Family members can view day templates"
ON public.day_templates
FOR SELECT
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "Family owners can manage day templates"
ON public.day_templates
FOR ALL
USING (is_family_owner(auth.uid(), family_id));

-- RLS policies for day_template_tasks
CREATE POLICY "Family members can view day template tasks"
ON public.day_template_tasks
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM day_templates dt
  WHERE dt.id = day_template_tasks.day_template_id
  AND is_family_member(auth.uid(), dt.family_id)
));

CREATE POLICY "Family owners can manage day template tasks"
ON public.day_template_tasks
FOR ALL
USING (EXISTS (
  SELECT 1 FROM day_templates dt
  WHERE dt.id = day_template_tasks.day_template_id
  AND is_family_owner(auth.uid(), dt.family_id)
));

-- Add updated_at trigger
CREATE TRIGGER update_day_templates_updated_at
BEFORE UPDATE ON public.day_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();