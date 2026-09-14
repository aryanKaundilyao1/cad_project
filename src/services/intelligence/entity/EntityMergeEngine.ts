import { supabase } from "@/integrations/supabase/client";

export class EntityMergeEngine {
  /**
   * Merges a source company into a target canonical company.
   * 1. Re-points all contacts
   * 2. Re-points all signal events
   * 3. Re-points aliases and creates an alias for the source company's primary name
   * 4. Appends to entity_audit_log
   * 5. Deletes the source company
   */
  static async mergeCompanies(sourceId: string, targetId: string, userId: string): Promise<void> {
    
    // Get source company details before deletion
    const { data: sourceCo } = await supabase.from('companies').select('*').eq('id', sourceId).single();
    if (!sourceCo) throw new Error("Source company not found");

    // 1. Re-point contacts
    await supabase.from('contacts').update({ company_id: targetId }).eq('company_id', sourceId);

    // 2. Re-point signals
    await supabase.from('signal_event_store').update({ company_id: targetId }).eq('company_id', sourceId);

    // 3. Re-point and create aliases
    await supabase.from('company_aliases').update({ company_id: targetId }).eq('company_id', sourceId);
    
    // Insert source primary name as an alias for the target
    await supabase.from('company_aliases').insert({
      company_id: targetId,
      alias_name: sourceCo.name,
      source: 'manual_merge'
    });

    // 4. Audit Log
    await supabase.from('entity_audit_log').insert({
      action_type: 'MERGE',
      primary_company_id: targetId,
      secondary_company_id: sourceId,
      details: {
        source_name: sourceCo.name,
        target_id: targetId
      },
      performed_by: userId
    });

    // 5. Delete source company (cascades where applicable, but we repointed the important ones)
    await supabase.from('companies').delete().eq('id', sourceId);
  }
}
