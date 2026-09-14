import { supabase } from '@/integrations/supabase/client';

import { EntityExtractionEngine } from './entityExtractionEngine';

export class DeduplicationEngine {

  static async processAllPendingLeads() {
    const { data: leads, error } = await supabase
      .from('raw_leads')
      .select('*')
      .in('status', ['RAW', 'PENDING']);
    
    if (error) throw error;
    if (!leads || leads.length === 0) return { processed: 0, duplicates: 0 };

    let processedCount = 0;
    let duplicateCount = 0;

    for (let lead of leads) {
      try {
        // 1. Entity Extraction & Normalization
        // PHASE 11: If this lead was uploaded via an Industry Template, it's already perfectly structured.
        // We skip the AI/Heuristic extraction completely.
        if (!lead.template_id) {
          const rawText = lead.raw_import ? JSON.stringify(lead.raw_import) : (lead.description || lead.company_name || '');
          const extractedLead = EntityExtractionEngine.extractEntities(rawText, lead);
          lead = { ...lead, ...extractedLead };
        }

        // 2. Duplicate Detection
        const isDuplicate = await this.detectDuplicate(lead);
        if (isDuplicate) {
          await supabase.from('raw_leads').update({ status: 'REJECTED', rejection_reason: 'Duplicate Record' }).eq('id', lead.id);
          duplicateCount++;
          continue;
        }

        // 3. Phase 8 Fix: Rejection Logic
        const isValid = this.validateLead(lead);
        if (!isValid) {
          await supabase.from('raw_leads').update({ status: 'REJECTED', rejection_reason: 'Missing Company, Project, and Description' }).eq('id', lead.id);
          processedCount++;
          continue;
        }

        // 4. Phase 5: Lead Type Detection
        const leadType = this.detectLeadType(lead);

        // 5. Phase 6: Industry Classification
        const classifiedLead = this.classifyIndustry(lead);

        // Move to PROCESSING and save extracted/classified data
        await supabase.from('raw_leads').update({
          lead_title: classifiedLead.lead_title,
          company_name: classifiedLead.company_name,
          project_name: classifiedLead.project_name,
          email: classifiedLead.email,
          phone: classifiedLead.phone,
          website: classifiedLead.website,
          state: classifiedLead.state,
          country: classifiedLead.country,
          description: classifiedLead.description,
          industry: classifiedLead.industry,
          sub_industry: classifiedLead.sub_industry,
          lead_type: leadType,
          status: 'PROCESSING'
        }).eq('id', lead.id);

        // 6. Phase 7: Run Scoring Engine & Tier Assignment
        // Legacy scoring engine removed  
        processedCount++;
      } catch (err) {
        console.error(`Error processing lead ${lead.id}:`, err);
      }
    }

    return { processed: processedCount, duplicates: duplicateCount };
  }

  // ==============================================================================
  // STAGE 1: DUPLICATE DETECTION
  // ==============================================================================
  private static async detectDuplicate(lead: any): Promise<boolean> {
    const orConditions = [];
    
    if (lead.website && lead.website.length > 5) {
      try {
        const url = new URL(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`);
        const domain = url.hostname.replace('www.', '');
        orConditions.push(`website.ilike.%${domain}%`);
      } catch (e) {
        orConditions.push(`website.ilike.%${lead.website}%`);
      }
    }

    if (lead.email && lead.email.length > 5) {
      const emailDomain = lead.email.split('@')[1];
      if (emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(emailDomain)) {
        orConditions.push(`email.ilike.%${emailDomain}%`);
      }
    }

    if (lead.company_name && lead.company_name.length > 5) {
      orConditions.push(`company_name.ilike.%${lead.company_name}%`);
    }

    if (lead.project_name && lead.project_name.length > 5) {
      orConditions.push(`project_name.ilike.%${lead.project_name}%`);
    }

    if (orConditions.length === 0) return false;

    const { data: duplicates } = await supabase
      .from('raw_leads')
      .select('id, status')
      .neq('id', lead.id)
      .neq('status', 'REJECTED')
      .or(orConditions.join(','));

    return (duplicates && duplicates.length > 0) || false;
  }

  // ==============================================================================
  // PHASE 8: RELAXED DATA VALIDATION
  // ==============================================================================
  private static validateLead(lead: any): boolean {
    // Only reject if company_name AND project_name AND description are NULL
    if (!lead.company_name && !lead.project_name && !lead.description) return false;
    return true;
  }

  // ==============================================================================
  // PHASE 5: LEAD TYPE DETECTION
  // ==============================================================================
  private static detectLeadType(lead: any): string {
    const content = `${lead.project_name || ''} ${lead.project_stage || ''} ${lead.description || ''}`.toLowerCase();
    
    if (content.includes('project') || content.includes('plant') || content.includes('facility') || 
        content.includes('expansion') || content.includes('tower') || content.includes('industrial park')) {
      return 'PROJECT_OPPORTUNITY';
    }
    if (content.includes('tender') || content.includes('bid')) return 'TENDER';
    if (content.includes('procurement') || content.includes('rfp')) return 'PROCUREMENT';
    if (content.includes('distributor') || content.includes('dealer')) return 'DISTRIBUTOR';
    if (content.includes('manufacturer') || content.includes('factory')) return 'MANUFACTURER';
    if (content.includes('export') || content.includes('importer')) return 'EXPORTER';
    
    const companyContent = `${lead.website || ''} ${lead.description || ''}`.toLowerCase();
    if (companyContent.includes('website') || companyContent.includes('products') || companyContent.includes('services')) {
      return 'COMPANY_LEAD';
    }

    return 'COMPANY_LEAD';
  }

  // ==============================================================================
  // PHASE 6: INDUSTRY CLASSIFICATION
  // ==============================================================================
  private static classifyIndustry(lead: any): any {
    const input = `${lead.industry || ''} ${lead.sub_industry || ''} ${lead.description || ''} ${lead.company_name || ''} ${lead.project_name || ''}`.toLowerCase();
    
    let industry = lead.industry || 'Unknown';
    let sub_industry = lead.sub_industry || 'Unknown';

    if (input.includes('peb') || input.includes('pre-engineered')) {
      industry = 'PEB';
    } else if (input.includes('construction') || input.includes('building')) {
      industry = 'Construction';
    } else if (input.includes('healthcare') || input.includes('pharma') || input.includes('hospital')) {
      industry = 'Healthcare';
      sub_industry = input.includes('homeopathy') ? 'Homeopathy' : 'Medical';
    } else if (input.includes('logistics') || input.includes('warehousing') || input.includes('warehouse')) {
      industry = 'Logistics';
      sub_industry = 'Warehouse';
    } else if (input.includes('manufacturing') || input.includes('components')) {
      industry = 'Manufacturing';
    } else if (input.includes('solar') || input.includes('renewable')) {
      industry = 'Solar';
    } else if (input.includes('hvac')) {
      industry = 'HVAC';
    } else if (input.includes('electrical')) {
      industry = 'Electrical';
    } else if (input.includes('fitout') || input.includes('interior')) {
      industry = 'Fitout';
    } else if (input.includes('export')) {
      industry = 'Export';
    }

    return { ...lead, industry, sub_industry };
  }
}
