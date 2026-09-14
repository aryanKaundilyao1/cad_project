import { supabase } from "@/integrations/supabase/client";

export class SignalWeightEngine {
  
  /**
   * Maps a signal to a product with a specific weight, tracking the version.
   */
  static async mapSignalToProduct(
    productId: string,
    signalDefinitionId: string,
    weight: 'High' | 'Medium' | 'Low',
    userId?: string,
    reason?: string
  ): Promise<any> {
    
    // 1. Check if mapping already exists
    const { data: existing, error: fetchErr } = await supabase
      .from('product_signal_mapping')
      .select('*')
      .eq('product_id', productId)
      .eq('signal_definition_id', signalDefinitionId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    let mappingId;
    let previousValue = null;

    if (existing) {
      mappingId = existing.id;
      previousValue = { weight: existing.weight };
      
      // Update
      const { error: updateErr } = await supabase
        .from('product_signal_mapping')
        .update({ weight })
        .eq('id', mappingId);
      if (updateErr) throw updateErr;
    } else {
      // Insert
      const { data: inserted, error: insertErr } = await supabase
        .from('product_signal_mapping')
        .insert({
          product_id: productId,
          signal_definition_id: signalDefinitionId,
          weight: weight
        })
        .select()
        .single();
        
      if (insertErr) throw insertErr;
      mappingId = inserted.id;
    }

    // 2. Log version
    const { error: logErr } = await supabase
      .from('mapping_versions')
      .insert({
        entity_type: 'PRODUCT_SIGNAL',
        entity_id: mappingId,
        previous_value: previousValue,
        new_value: { weight },
        changed_by: userId || null,
        reason: reason || 'Weight adjustment via engine'
      });
      
    if (logErr) {
      console.warn("Failed to log mapping version:", logErr);
    }

    return { mappingId, weight };
  }

  /**
   * Retrieves all signal mappings for a specific product.
   */
  static async getProductSignalMappings(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_signal_mapping')
      .select(`
        id, weight, confidence, source,
        signal_definitions(id, name, category, description)
      `)
      .eq('product_id', productId);
      
    if (error) throw error;
    return data || [];
  }
}
