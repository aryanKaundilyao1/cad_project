import { supabase } from "@/integrations/supabase/client";
import { EntityCandidateService } from "../entity/EntityCandidateService";
import { EntityMatchingEngine } from "../entity/EntityMatchingEngine";

export class EntityResolver {
  
  static async resolveCompany(companyName: string): Promise<string> {
    const candidates = await EntityCandidateService.findCandidatesByName(companyName);
    
    if (candidates.length > 0) {
      const matchResults = EntityMatchingEngine.calculateConfidence(companyName, candidates);
      const topMatch = matchResults[0];

      if (topMatch.confidence >= 95) {
        // Auto-match
        return topMatch.candidate_id;
      }

      if (topMatch.confidence >= 70) {
        // Send to Review Queue and create a temporary placeholder company for now
        const tempId = await this.createNewCompany(companyName, 50); // Low confidence placeholder
        
        await supabase.from('entity_review_queue').insert({
          incoming_payload: { companyName },
          candidate_company_ids: matchResults.map(m => m.candidate_id),
          confidence_score: topMatch.confidence,
          matching_reasons: topMatch.reasons,
          status: 'pending'
        });

        return tempId;
      }
    }

    // No candidates or score < 70, create new
    return await this.createNewCompany(companyName, 100);
  }

  private static async createNewCompany(name: string, confidence: number): Promise<string> {
    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert({ 
        name: name.trim(),
        industry: 'Unknown (External Provider)',
        resolution_confidence: confidence
      })
      .select('id')
      .single();

    if (error) throw error;
    return newCompany.id;
  }
}

