// src/lib/importPipeline.ts

import { supabase } from "@/integrations/supabase/client";

export type PipelineStep = 
  | 'upload' 
  | 'field_detection' 
  | 'auto_mapping' 
  | 'duplicate_detection' 
  | 'company_merge' 
  | 'module_creation' 
  | 'evidence_assignment' 
  | 'verification' 
  | 'scoring' 
  | 'marketplace_sync' 
  | 'search_index' 
  | 'crm_assignment'
  | 'completed';

export interface CsvRow {
  [key: string]: string;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  processedCount: number;
  errorCount: number;
}

/**
 * Normalizes CSV keys to standard internal mapping keys
 */
export const detectAndMapFields = (rawRow: CsvRow): Record<string, string> => {
  const mapped: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawRow)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('company') || lowerKey.includes('org') || lowerKey.includes('legal name')) {
      mapped['Company_Legal_Name'] = val;
    } else if (lowerKey.includes('website') || lowerKey.includes('domain')) {
      mapped['Website'] = val;
    } else if (lowerKey.includes('id') || lowerKey.includes('duns') || lowerKey.includes('tax')) {
      mapped['Company_Identifier'] = val;
    } else if (lowerKey.includes('address') || lowerKey.includes('location')) {
      mapped['Full_Address'] = val;
    } else if (lowerKey.includes('industry') || lowerKey.includes('sector')) {
      mapped['Primary_Industry'] = val;
    } else if (lowerKey.includes('phone')) {
      mapped['Main_Phone'] = val;
    } else if (lowerKey.includes('first name') || lowerKey.includes('contact name')) {
      mapped['Contact_Name'] = val;
    } else if (lowerKey.includes('email')) {
      mapped['Contact_Email'] = val;
    } else if (lowerKey.includes('title')) {
      mapped['Contact_Title'] = val;
    } else if (lowerKey.includes('linkedin')) {
      mapped['LinkedIn_URL'] = val;
    } else if (lowerKey.includes('opportunity') && lowerKey.includes('title')) {
      mapped['Opportunity_Title'] = val;
    } else if (lowerKey.includes('budget') || lowerKey.includes('value')) {
      mapped['Opportunity_Budget_USD'] = val;
    } else if (lowerKey.includes('deadline')) {
      mapped['Opportunity_Deadline_YYYYMMDD'] = val;
    } else if (lowerKey.includes('product') || lowerKey.includes('keyword')) {
      mapped['Product_Keywords_Comma_Separated'] = val;
    } else if (lowerKey.includes('source')) {
      mapped['Source_Name'] = val;
    } else {
      mapped[key] = val; // fallback
    }
  }
  return mapped;
};

/**
 * Executes the core 12-step logic for a single mapped row.
 * In a production environment, steps 6-12 would happen asynchronously via Edge Functions, 
 * but this serves as the foundational orchestrator.
 */
export const processMappedRow = async (row: Record<string, string>): Promise<boolean> => {
  try {
    // 1. Ensure Source Exists
    const sourceName = row['Source_Name'] || 'CSV Upload';
    let { data: sourceData } = await supabase
      .from('jas_sources')
      .select('source_id')
      .eq('name', sourceName)
      .single();

    if (!sourceData) {
      const { data: newSource } = await supabase
        .from('jas_sources')
        .insert([{ name: sourceName, type: 'CSV' }])
        .select()
        .single();
      sourceData = newSource;
    }

    if (!sourceData) return false;

    // 2. Duplicate Detection & Company Merge (Tier 2 Website Match)
    let companyId: string | null = null;
    const website = row['Website'];
    
    if (website) {
      const { data: existingCompany } = await supabase
        .from('jas_companies')
        .select('company_id')
        .eq('primary_domain', website)
        .maybeSingle();
      
      if (existingCompany) {
        companyId = existingCompany.company_id;
      }
    }

    // 3. Create Company if not found
    if (!companyId && row['Company_Legal_Name']) {
      const { data: newCompany } = await supabase
        .from('jas_companies')
        .insert([{
          legal_name: row['Company_Legal_Name'],
          primary_domain: website || null,
          universal_id: row['Company_Identifier'] || null,
          primary_industry: row['Primary_Industry'] || null
        }])
        .select()
        .single();
      
      if (newCompany) companyId = newCompany.company_id;
    }

    if (!companyId) return false; // Hard requirement failed

    // 4. Module Creation (Evidence Assignment)
    if (row['Full_Address']) {
      await supabase.from('jas_evidence_modules').insert([{
        entity_type: 'Company',
        entity_id: companyId,
        source_id: sourceData.source_id,
        module_type: 'GoogleMaps',
        raw_data: { full_address: row['Full_Address'] }
      }]);
    }

    // 5. Contact Creation
    if (row['Contact_Email']) {
      await supabase.from('jas_contacts').upsert([{
        company_id: companyId,
        email: row['Contact_Email'],
        first_name: row['Contact_Name']?.split(' ')[0] || null,
        last_name: row['Contact_Name']?.split(' ').slice(1).join(' ') || null,
        job_title: row['Contact_Title'] || null,
        phone: row['Main_Phone'] || null,
        linkedin_url: row['LinkedIn_URL'] || null
      }], { onConflict: 'company_id, email' });
    }

    // 6. Opportunity Module
    if (row['Opportunity_Title']) {
      await supabase.from('jas_opportunities').insert([{
        company_id: companyId,
        title: row['Opportunity_Title'],
        type: 'Tender',
        budget: row['Opportunity_Budget_USD'] ? parseFloat(row['Opportunity_Budget_USD']) : null,
        deadline_date: row['Opportunity_Deadline_YYYYMMDD'] || null
      }]);
    }

    // NOTE: Verification, Scoring, Sync, Search Index, and CRM Assignment 
    // are omitted here as they are best handled by Database Triggers on the newly created entities.
    // The pipeline orchestrator has successfully routed the data into the Universal Data Model.
    
    return true;
  } catch (err) {
    console.error("Error processing row:", err);
    return false;
  }
};
