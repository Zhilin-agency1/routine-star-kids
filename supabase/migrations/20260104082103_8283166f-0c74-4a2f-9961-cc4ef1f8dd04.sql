-- Add optional child_id to store_items (null = available for all children)
ALTER TABLE public.store_items 
ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id) ON DELETE SET NULL;

-- Add optional child_id to job_board_items (null = family-wide job)
ALTER TABLE public.job_board_items 
ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id) ON DELETE SET NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_store_items_child_id ON public.store_items(child_id);
CREATE INDEX IF NOT EXISTS idx_job_board_items_child_id ON public.job_board_items(child_id);