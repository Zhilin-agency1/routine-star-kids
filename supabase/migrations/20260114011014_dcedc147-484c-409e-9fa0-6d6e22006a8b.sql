-- Children can delete their own notifications
CREATE POLICY "Children can delete their notifications"
ON public.notifications
FOR DELETE
USING (
  recipient_type = 'child' 
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = notifications.recipient_child_id 
    AND c.linked_user_id = auth.uid()
  )
);