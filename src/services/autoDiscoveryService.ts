import { supabase } from "@/integrations/supabase/client";

export const autoDiscoveryService = {
  /**
   * Automatically discovers matching leads based on the user's business profile
   * and loads them into the Pipeline at the 'Discovery' stage.
   */
  loadMatchingLeadsToPipeline: async (workspaceId: string, businessProfile: any) => {
    if (!businessProfile) return;

    try {
      // Extract user criteria
      const userNiche = (businessProfile.niche || '').toLowerCase();
      const userSubNiche = (businessProfile.sub_niche || '').toLowerCase();
      const userIndustry = (businessProfile.industry || '').toLowerCase();

      if (!userNiche && !userSubNiche && !userIndustry) return;

      // 1. Fetch all leads from jas_companies
      // In a production app, we would use a more targeted query or full-text search.
      const { data: allLeads, error: leadsError } = await supabase
        .from('jas_companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Batched fetch for performance

      if (leadsError) throw leadsError;
      if (!allLeads || allLeads.length === 0) return;

      // 2. Fetch existing opportunities to prevent duplicates
      const { data: existingOpps } = await supabase
        .from('opportunities')
        .select('legacy_lead_id')
        .eq('workspace_id', workspaceId)
        .not('legacy_lead_id', 'is', null);
      
      const existingLeadIds = new Set(existingOpps?.map(o => o.legacy_lead_id) || []);

      // 3. Match leads against profile
      const leadsToCreate = [];
      for (const lead of allLeads) {
        if (existingLeadIds.has(lead.id)) continue;

        const leadDesc = (lead.business_description || '').toLowerCase();
        const leadTitle = (lead.company_name || '').toLowerCase();
        const leadIndustry = (lead.industry || lead.sub_industry || '').toLowerCase();
        
        const searchableText = `${leadDesc} ${leadTitle} ${leadIndustry}`;
        
        let isMatch = false;
        if (userSubNiche && searchableText.includes(userSubNiche)) isMatch = true;
        else if (userNiche && searchableText.includes(userNiche)) isMatch = true;
        else if (userIndustry && leadIndustry.includes(userIndustry)) isMatch = true;
        
        // If no niche is specified in profile, we'll match by industry to be safe, 
        // or we just bring them in if we are missing matches (as per user's "same industry" rule).
        if (!isMatch && userIndustry && leadIndustry === userIndustry) isMatch = true;
        
        if (isMatch) {
          leadsToCreate.push(lead);
        }
      }

      if (leadsToCreate.length === 0) return;

      // 4. Create Opportunities for matched leads
      for (const lead of leadsToCreate) {
        // Ensure Account exists
        let accountId = null;
        let accountQuery = supabase
          .from('accounts')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('legacy_company_id', lead.id);

        const { data: existingAccount } = await accountQuery.maybeSingle();

        if (existingAccount) {
          accountId = existingAccount.id;
        } else {
          const { data: newAccount } = await supabase
            .from('accounts')
            .insert({
              workspace_id: workspaceId,
              legacy_company_id: lead.id,
              name: lead.company_name || 'Unknown Company',
              industry: lead.industry || lead.sub_industry,
              hq_location: lead.headquarters || lead.city,
              city: lead.city,
              country: lead.country,
              created_by: workspaceId
            })
            .select('id')
            .single();

          if (newAccount) accountId = newAccount.id;
        }

        // Insert Opportunity in Discovery stage
        await supabase
          .from('opportunities')
          .insert({
            workspace_id: workspaceId,
            account_id: accountId,
            legacy_lead_id: lead.id,
            title: `${lead.company_name || 'Unknown'} - Discovery`,
            description: lead.business_description,
            industry: lead.industry || lead.sub_industry,
            estimated_value: lead.estimated_revenue || 0,
            source: 'Auto-Discovery Pipeline',
            stage: 'discovery',
            assigned_to: workspaceId,
            created_by: workspaceId,
          });
      }

    } catch (error) {
      console.error("Auto Discovery Failed:", error);
    }
  }
};
