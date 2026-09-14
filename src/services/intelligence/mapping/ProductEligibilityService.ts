import { supabase } from "@/integrations/supabase/client";

export class ProductEligibilityService {
  
  /**
   * Evaluates if a company qualifies for specific products based on its resolved archetypes
   * and relevant signals.
   */
  static async evaluateCompanyEligibility(companyId: string): Promise<any[]> {
    
    // 1. Fetch resolved archetypes for this company
    const { data: matchedArchetypes, error: archErr } = await supabase
      .from('archetype_matches')
      .select('archetype_id')
      .eq('company_id', companyId);

    if (archErr) throw archErr;
    if (!matchedArchetypes || matchedArchetypes.length === 0) return [];

    const archetypeIds = matchedArchetypes.map(ma => ma.archetype_id);

    // 2. Fetch products mapped to these archetypes
    const { data: eligibleMappings, error: prodErr } = await supabase
      .from('product_archetype_mapping')
      .select(`
        product_id,
        products (id, name, category)
      `)
      .in('archetype_id', archetypeIds);

    if (prodErr) throw prodErr;

    // Deduplicate products (in case multiple archetypes map to same product)
    const productMap = new Map();
    for (const mapping of eligibleMappings || []) {
      if (!productMap.has(mapping.product_id)) {
        productMap.set(mapping.product_id, mapping.products);
      }
    }

    const matches = [];

    // 3. Save matches to company_product_matches
    for (const [productId, product] of Array.from(productMap.entries())) {
      const reason_codes = ['ARCHETYPE_MATCH']; // We matched via buyer archetype
      
      const { error: upsertErr } = await supabase
        .from('company_product_matches')
        .upsert({
          company_id: companyId,
          product_id: productId,
          confidence: 100, // Deterministic mapping via archetype
          reason_codes: reason_codes
        }, { onConflict: 'company_id, product_id' });

      if (upsertErr) {
        console.error("Failed to save product eligibility match", upsertErr);
      } else {
        matches.push({ product, reason_codes });
      }
    }

    return matches;
  }
}
