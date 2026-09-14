-- RUN THIS ENTIRE FILE IN YOUR SUPABASE SQL EDITOR --

-- 1. crm_companies (Core Entity - Holds both scraper data and enrichment aggregations)
CREATE TABLE IF NOT EXISTS public.crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID,
    
    -- Added from Enrichment module
    query_company_name TEXT,
    query_website_url TEXT,
    jas_opportunity_score INTEGER,
    
    -- From Website Scraper module
    company_name TEXT NOT NULL,
    website_url TEXT,
    business_description TEXT,
    industry TEXT,
    sub_industry TEXT,
    year_founded INTEGER,
    headquarters TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pincode TEXT,
    general_email TEXT,
    support_email TEXT,
    sales_email TEXT,
    phone_numbers JSONB DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    services JSONB DEFAULT '[]'::jsonb,
    industries_served JSONB DEFAULT '[]'::jsonb,
    target_customers JSONB DEFAULT '[]'::jsonb,
    business_categories JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_user_id ON public.crm_companies(user_id);
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own saved companies" 
    ON public.crm_companies FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. crm_company_socials
CREATE TABLE IF NOT EXISTS public.crm_company_socials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_company_socials_company_id ON public.crm_company_socials(company_id);
ALTER TABLE public.crm_company_socials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage socials of their companies" 
    ON public.crm_company_socials FOR ALL USING (
        EXISTS (SELECT 1 FROM public.crm_companies WHERE id = company_id AND user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 3. crm_company_contacts (General contacts, phones, generic emails)
CREATE TABLE IF NOT EXISTS public.crm_company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_company_contacts_company_id ON public.crm_company_contacts(company_id);
ALTER TABLE public.crm_company_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage contacts of their companies" 
    ON public.crm_company_contacts FOR ALL USING (
        EXISTS (SELECT 1 FROM public.crm_companies WHERE id = company_id AND user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 4. crm_decision_makers (People / Executives)
CREATE TABLE IF NOT EXISTS public.crm_decision_makers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    designation TEXT,
    profile_url TEXT,
    company_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_decision_makers_company_id ON public.crm_decision_makers(company_id);
ALTER TABLE public.crm_decision_makers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage decision makers of their companies" 
    ON public.crm_decision_makers FOR ALL USING (
        EXISTS (SELECT 1 FROM public.crm_companies WHERE id = company_id AND user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 5. crm_company_analysis
CREATE TABLE IF NOT EXISTS public.crm_company_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    opportunity_score INTEGER,
    overview TEXT,
    what_company_does TEXT,
    target_market TEXT,
    industry_classification TEXT,
    potential_business_opportunities TEXT,
    supplier_opportunity_analysis TEXT,
    distributor_opportunity_analysis TEXT,
    procurement_potential TEXT,
    export_potential TEXT,
    suggested_outreach_strategy TEXT,
    suggested_decision_makers_to_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_company_analysis_company_id ON public.crm_company_analysis(company_id);
ALTER TABLE public.crm_company_analysis ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage analysis of their companies" 
    ON public.crm_company_analysis FOR ALL USING (
        EXISTS (SELECT 1 FROM public.crm_companies WHERE id = company_id AND user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 6. crm_outreach_recommendations
CREATE TABLE IF NOT EXISTS public.crm_outreach_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    draft_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_outreach_recommendations_company_id ON public.crm_outreach_recommendations(company_id);
ALTER TABLE public.crm_outreach_recommendations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage outreach drafts of their companies" 
    ON public.crm_outreach_recommendations FOR ALL USING (
        EXISTS (SELECT 1 FROM public.crm_companies WHERE id = company_id AND user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 7. crm_company_field_sources (Strict Provenance Tracking for Enrichment)
CREATE TABLE IF NOT EXISTS public.crm_company_field_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,          
    field_value TEXT NOT NULL,         
    source_type TEXT NOT NULL,         
    source_url TEXT,                   
    confidence_score INTEGER,          
    last_verified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_company_field_sources_company_id ON public.crm_company_field_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_company_field_sources_field_name ON public.crm_company_field_sources(field_name);
ALTER TABLE public.crm_company_field_sources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage field sources of their companies" 
    ON public.crm_company_field_sources FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. crm_company_signals (Growth Signals)
CREATE TABLE IF NOT EXISTS public.crm_company_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    description TEXT NOT NULL,         
    source_type TEXT NOT NULL,
    source_url TEXT NOT NULL,
    confidence_score INTEGER NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_company_signals_company_id ON public.crm_company_signals(company_id);
ALTER TABLE public.crm_company_signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage signals of their companies" 
    ON public.crm_company_signals FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
