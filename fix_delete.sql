-- 1. Fix the RLS Policy
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads" ON public.leads 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- 2. Update the foreign key constraint to cascade deletions to opportunities
ALTER TABLE public.opportunities 
  DROP CONSTRAINT IF EXISTS opportunities_legacy_lead_id_fkey;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_legacy_lead_id_fkey 
  FOREIGN KEY (legacy_lead_id) 
  REFERENCES public.leads(id) 
  ON DELETE CASCADE;

-- 3. Update the foreign key constraint for lead_images
ALTER TABLE public.lead_images 
  DROP CONSTRAINT IF EXISTS lead_images_lead_id_fkey;

ALTER TABLE public.lead_images
  ADD CONSTRAINT lead_images_lead_id_fkey 
  FOREIGN KEY (lead_id) 
  REFERENCES public.leads(id) 
  ON DELETE CASCADE;
