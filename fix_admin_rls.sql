-- Fix sync_logs RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert for sync_logs" ON public.sync_logs;
CREATE POLICY "Allow authenticated insert for sync_logs" 
ON public.sync_logs 
FOR INSERT TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can do everything on sync_logs" ON public.sync_logs;
CREATE POLICY "Admins can do everything on sync_logs" 
ON public.sync_logs 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));


-- Fix opportunities RLS for Admins
DROP POLICY IF EXISTS "Admins can do everything on opportunities" ON public.opportunities;
CREATE POLICY "Admins can do everything on opportunities" 
ON public.opportunities 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));


-- Fix opportunity_scores RLS for Admins
ALTER TABLE public.opportunity_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on opportunity_scores" ON public.opportunity_scores;
CREATE POLICY "Admins can do everything on opportunity_scores" 
ON public.opportunity_scores 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));


-- Fix crm_leads RLS for Admins just in case
DROP POLICY IF EXISTS "Admins can do everything on crm_leads" ON public.crm_leads;
CREATE POLICY "Admins can do everything on crm_leads" 
ON public.crm_leads 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));
