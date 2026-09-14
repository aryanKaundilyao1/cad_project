import { supabase } from "@/integrations/supabase/client";

export interface LeadPayload {
  company_name?: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  country?: string;
  source_id?: string;
  [key: string]: any;
}

export abstract class BaseConnector {
  abstract readonly sourceName: string;

  /**
   * Execute the connector logic. Subclasses implement their own API calls.
   * @param params Any parameters needed for the specific connector (e.g. industry, location)
   */
  abstract fetchLeads(params: any): Promise<LeadPayload[]>;

  /**
   * Normalize specific payloads to our common LeadPayload format
   */
  protected abstract normalize(rawResult: any): LeadPayload;

  /**
   * Saves normalized leads to the raw_leads table in Supabase.
   */
  async saveToRawLeads(leads: LeadPayload[]): Promise<{ success: boolean; count: number; error?: any }> {
    if (!leads || leads.length === 0) return { success: true, count: 0 };

    const formattedLeads = leads.map(lead => ({
      company_name: lead.company_name || null,
      website: lead.website || null,
      email: lead.email || null,
      phone: lead.phone || null,
      industry: lead.industry || null,
      country: lead.country || null,
      source: this.sourceName,
      source_id: lead.source_id || null,
      raw_payload: lead,
      status: 'PENDING'
    }));

    try {
      const { error } = await supabase.from('raw_leads').insert(formattedLeads);
      if (error) throw error;
      
      return { success: true, count: formattedLeads.length };
    } catch (error) {
      console.error(`Error saving leads from ${this.sourceName}:`, error);
      return { success: false, count: 0, error };
    }
  }
}
