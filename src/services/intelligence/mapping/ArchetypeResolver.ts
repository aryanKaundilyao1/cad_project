import { supabase } from "@/integrations/supabase/client";
import { CompanyProfileService } from "../profile/CompanyProfileService";

export class ArchetypeResolver {
  
  /**
   * Deterministically evaluates a company's profile against known buyer archetypes.
   * Does NOT use ML. Relies on industry, firmographics, and direct signals.
   */
  static async resolveArchetypesForCompany(companyId: string): Promise<any[]> {
    
    // 1. Fetch Company Intelligence Profile
    const profile = await CompanyProfileService.getIntelligenceProfile(companyId);
    if (!profile.company) throw new Error("Company not found");

    // 2. Fetch all active archetypes
    const { data: archetypes, error: archErr } = await supabase
      .from('buyer_archetypes')
      .select('*')
      .eq('status', 'active');
      
    if (archErr) throw archErr;

    const matches = [];

    // 3. Evaluate each archetype deterministically
    for (const archetype of archetypes || []) {
      let confidence = 0;
      const reasons: string[] = [];

      // Industry Match
      if (archetype.industry && profile.company.industry) {
        if (archetype.industry.toLowerCase() === profile.company.industry.toLowerCase()) {
          confidence += 60; // Strong base indicator
          reasons.push(`Exact industry match: ${archetype.industry}`);
        } else if (profile.company.industry.toLowerCase().includes(archetype.industry.toLowerCase())) {
          confidence += 30; // Partial match
          reasons.push(`Partial industry match: ${archetype.industry}`);
        }
      }

      // Signal Evaluation (Specific signals can strongly indicate an archetype)
      // E.g., 'Warehouse Expansion' strongly implies 'Warehouse Developer'
      if (profile.signals && profile.signals.length > 0) {
        const hasRelevantSignal = profile.signals.some((s: any) => 
          s.signal_definitions?.name?.toLowerCase().includes('warehouse') ||
          s.signal_definitions?.category?.toLowerCase() === archetype.industry?.toLowerCase()
        );
        if (hasRelevantSignal) {
          confidence += 40;
          reasons.push('Relevant signals detected aligning with archetype');
        }
      }

      // 4. Save Matches > 50%
      if (confidence > 50) {
        const finalConfidence = Math.min(confidence, 100);
        
        // Upsert into archetype_matches
        const { error: upsertErr } = await supabase
          .from('archetype_matches')
          .upsert({
            company_id: companyId,
            archetype_id: archetype.id,
            confidence: finalConfidence,
            reasons: reasons
          }, { onConflict: 'company_id, archetype_id' });
          
        if (upsertErr) {
          console.error("Failed to save archetype match", upsertErr);
        } else {
          matches.push({
            archetype,
            confidence: finalConfidence,
            reasons
          });
        }
      }
    }

    return matches;
  }
}
