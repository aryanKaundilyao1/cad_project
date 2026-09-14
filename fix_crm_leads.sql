-- 1. Drop NOT NULL constraint on 'name' in crm_leads as B2B leads often only have a company name
ALTER TABLE public.crm_leads ALTER COLUMN name DROP NOT NULL;

-- 2. Update the trigger to ensure it always provides a fallback just in case
CREATE OR REPLACE FUNCTION public.auto_populate_user_crm()
RETURNS TRIGGER AS $$
DECLARE
  matching_profile RECORD;
BEGIN
  -- Only run if the lead has a valid seller_id
  IF NEW.seller_id IS NOT NULL THEN
    FOR matching_profile IN
      SELECT bp.user_id, bp.company_name
      FROM public.business_profiles bp
      JOIN public.profiles p ON p.id = bp.user_id
      WHERE LOWER(COALESCE(bp.business_niche, '')) = LOWER(NEW.niche)
         OR LOWER(COALESCE(p.business_type, '')) = LOWER(NEW.niche)
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.crm_leads
        WHERE assigned_to = matching_profile.user_id AND (
          (NEW.email IS NOT NULL AND email = NEW.email) OR
          (NEW.phone IS NOT NULL AND phone = NEW.phone) OR
          (NEW.company_name IS NOT NULL AND company = NEW.company_name)
        )
      ) THEN
        INSERT INTO public.crm_leads (
          assigned_to, company, name, email, phone,
          status, source_type, source_origin, notes, website
        ) VALUES (
          matching_profile.user_id,
          COALESCE(NEW.company_name, NEW.title, 'Unknown Company'),
          COALESCE(NEW.contact_name, 'Unknown Contact'),
          NEW.email,
          NEW.phone,
          'new',
          'auto',
          'auto_niche',
          'Auto-assigned via JAS CONNECT AI lead intelligence matching niche: ' || COALESCE(NEW.niche, 'Unknown'),
          NEW.website
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
