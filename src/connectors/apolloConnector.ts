import { BaseConnector, LeadPayload } from './BaseConnector';
import { supabase } from "@/integrations/supabase/client";

export class ApolloConnector extends BaseConnector {
  readonly sourceName = 'Apollo';

  async fetchLeads(params: { api_key?: string; domain: string }): Promise<LeadPayload[]> {
    console.log(`[${this.sourceName}] Enriching domain ${params.domain}...`);
    
    // In a real implementation, call Apollo API to get company/employee details.
    
    const mockApiResponse = [
      {
        organization_name: 'Apollo Enriched Co',
        domain: params.domain,
        primary_email: `contact@${params.domain}`,
        primary_phone: '+1 800 123 4567',
        industry: 'Software',
        country: 'US',
        apollo_org_id: 'org_abc123',
        decision_makers: ['CEO: John Doe', 'CTO: Jane Smith']
      }
    ];

    return mockApiResponse.map(result => this.normalize(result));
  }

  protected normalize(rawResult: any): LeadPayload {
    return {
      company_name: rawResult.organization_name,
      website: rawResult.domain,
      email: rawResult.primary_email,
      phone: rawResult.primary_phone,
      industry: rawResult.industry,
      country: rawResult.country,
      source_id: rawResult.apollo_org_id,
      ...rawResult
    };
  }

  /**
   * Phase 5 specifies Apollo pushes into the enrichment layer.
   * We override saveToRawLeads or create an enrichment specific function to update existing leads.
   */
  async enrichExistingLead(rawLeadId: string, domain: string) {
    const leads = await this.fetchLeads({ domain });
    if (leads.length > 0) {
      const enrichedData = leads[0];
      await supabase.from('raw_leads').update({
        raw_payload: enrichedData,
        status: 'ENRICHED',
        email: enrichedData.email,
        phone: enrichedData.phone
      }).eq('id', rawLeadId);
    }
  }
}
