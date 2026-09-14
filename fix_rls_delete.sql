-- Drop the existing policy if we need to replace it
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Create policy allowing admins to delete ANY lead
CREATE POLICY "Admins can delete leads" ON public.leads 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
