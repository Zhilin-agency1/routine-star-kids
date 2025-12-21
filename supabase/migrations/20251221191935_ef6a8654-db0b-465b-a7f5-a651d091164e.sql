-- Create wishlist table for children to mark desired store items
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, store_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist access
CREATE POLICY "Users can view wishlists in their family" 
ON public.wishlists 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.children c 
    JOIN public.families f ON c.family_id = f.id 
    WHERE c.id = wishlists.child_id 
    AND (f.owner_user_id = auth.uid() OR c.linked_user_id = auth.uid())
  )
);

CREATE POLICY "Users can add to wishlist for their children or themselves" 
ON public.wishlists 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.children c 
    JOIN public.families f ON c.family_id = f.id 
    WHERE c.id = wishlists.child_id 
    AND (f.owner_user_id = auth.uid() OR c.linked_user_id = auth.uid())
  )
);

CREATE POLICY "Users can remove from wishlist" 
ON public.wishlists 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.children c 
    JOIN public.families f ON c.family_id = f.id 
    WHERE c.id = wishlists.child_id 
    AND (f.owner_user_id = auth.uid() OR c.linked_user_id = auth.uid())
  )
);