import { supabase } from "@/integrations/supabase/client";
import { OpportunityContextProvider } from "./providers/OpportunityContextProvider";
import { ActionContextProvider } from "./providers/ActionContextProvider";
import { ContextRelevanceEngine } from "./ContextRelevanceEngine";
import { ContextPrioritizationEngine } from "./ContextPrioritizationEngine";

export class ContextPackagingPipeline {
  /**
   * The master orchestrator that builds, filters, and compresses intelligence 
   * into a finalized, cited Context Package for the LLM.
   */
  static async buildContextPackage(opportunityId: string, sessionId: string, intentType: string) {
    // 1. Gather Raw Intelligence Blocks
    const oppBlock = await OpportunityContextProvider.getContext(opportunityId);
    const actionBlock = await ActionContextProvider.getContext(opportunityId);
    
    let rawBlocks = [oppBlock, actionBlock].filter(Boolean);

    // 2. Filter by Relevance
    const relevantBlocks = ContextRelevanceEngine.filterRelevantContext(rawBlocks, intentType);

    // 3. Prioritize & Compress (Token Budgeting)
    const finalPayload = ContextPrioritizationEngine.compressToBudget(relevantBlocks, 2000);

    // 4. Save Final Package & Evidence
    const { data: packageRecord, error } = await supabase
      .from('context_packages')
      .insert({
        opportunity_id: opportunityId,
        session_id: sessionId,
        intent_type: intentType,
        payload: finalPayload,
        total_tokens: JSON.stringify(finalPayload).length / 4 // mock count
      })
      .select('id')
      .single();

    if (error) throw error;

    // Save Context Evidence to force LLM Citations
    for (const block of finalPayload) {
      if (!block) continue;
      await supabase.from('context_evidence').insert({
        package_id: packageRecord.id,
        source_system: block.source_system,
        source_table: block.source_system,
        source_id: block.source_id || opportunityId,
        raw_value: block.data
      });
    }

    return packageRecord.id;
  }
}
