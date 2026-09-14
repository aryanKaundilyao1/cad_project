import { supabase } from "@/integrations/supabase/client";

export class EntityCandidateService {
  /**
   * Searches for candidate companies based on a name string.
   * Checks both the primary company name and the aliases table.
   */
  static async findCandidatesByName(name: string): Promise<any[]> {
    const normalizedName = name.trim();
    
    // 1. Search primary companies
    const { data: primaryMatches } = await supabase
      .from('companies')
      .select('id, name, domain, industry')
      .ilike('name', `%${normalizedName}%`);

    // 2. Search aliases
    const { data: aliasMatches } = await supabase
      .from('company_aliases')
      .select('company_id, alias_name, companies(id, name, domain, industry)')
      .ilike('alias_name', `%${normalizedName}%`);

    // Deduplicate candidates based on company_id
    const candidatesMap = new Map<string, any>();
    
    primaryMatches?.forEach(m => {
      candidatesMap.set(m.id, { ...m, matched_via: 'primary_name' });
    });

    aliasMatches?.forEach(m => {
      if (m.company_id && !candidatesMap.has(m.company_id)) {
        candidatesMap.set(m.company_id, { ...m.companies, matched_via: 'alias', matched_alias: m.alias_name });
      }
    });

    return Array.from(candidatesMap.values());
  }
}
