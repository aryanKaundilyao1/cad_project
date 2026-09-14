import { supabase } from "@/integrations/supabase/client";
import { EntityMergeEngine } from "./EntityMergeEngine";

export class EntityReviewEngine {
  /**
   * Approves a match in the review queue.
   * If a targetCompanyId is provided, the temporary company created during ingestion is merged into the target.
   * If rejected, the temporary company remains a new canonical company.
   */
  static async resolveQueueItem(queueId: string, action: 'approve' | 'reject', targetCompanyId?: string, userId?: string): Promise<void> {
    
    const { data: queueItem } = await supabase.from('entity_review_queue').select('*').eq('id', queueId).single();
    if (!queueItem) throw new Error("Queue item not found");

    if (action === 'approve') {
      if (!targetCompanyId) throw new Error("Must provide target company ID to approve a merge");
      
      // We need to find the temporary company created by the resolver.
      // The resolver created it with the incoming name, but we didn't store the temp ID in the queue.
      // For this Phase 3C implementation, we'll assume the temp company can be found by exact name and 50 confidence.
      // (In production we should attach the temp_company_id directly to the review queue row).
      const { data: tempCo } = await supabase
        .from('companies')
        .select('id')
        .eq('name', queueItem.incoming_payload.companyName)
        .eq('resolution_confidence', 50)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tempCo) {
        await EntityMergeEngine.mergeCompanies(tempCo.id, targetCompanyId, userId || 'system');
      }

      await supabase.from('entity_review_queue').update({
        status: 'approved',
        resolved_company_id: targetCompanyId,
        resolved_at: new Date().toISOString(),
        resolved_by: userId
      }).eq('id', queueId);

    } else {
      // Rejecting means the temporary company gets promoted to a full canonical company
      const { data: tempCo } = await supabase
        .from('companies')
        .select('id')
        .eq('name', queueItem.incoming_payload.companyName)
        .eq('resolution_confidence', 50)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tempCo) {
        await supabase.from('companies').update({ resolution_confidence: 100 }).eq('id', tempCo.id);
      }

      await supabase.from('entity_review_queue').update({
        status: 'rejected',
        resolved_at: new Date().toISOString(),
        resolved_by: userId
      }).eq('id', queueId);
    }
  }
}
