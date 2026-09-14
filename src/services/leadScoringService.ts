import { supabase } from '@/integrations/supabase/client';
import { scoreLead } from '@/scoring/pipeline';
import type { RawLeadRecord } from '@/scoring/types';

export const leadScoringService = {
  /**
   * Identifies leads that lack a score, runs the OIE pipeline on them,
   * and saves the updated score back to Supabase.
   */
  async autoCalculateMissingScores(leads: any[]) {
    // Filter out leads that don't need recalculation
    const leadsToScore = leads.filter(
      (lead) => !lead.current_score || lead.current_score <= 25 || lead.force_recalculate
    );

    if (leadsToScore.length === 0) {
      return 0; // Nothing to do
    }
    
    try {
      // We now pass the lead IDs to the edge function which handles calculating
      // the score, updating the `leads` table, and recording the history.
      // This correctly bypasses client-side RLS on the `leads` table using the service role.
      const leadIds = leadsToScore.map(l => l.id);
      
      const { data, error } = await supabase.functions.invoke('run-client-scoring', {
        body: { lead_ids: leadIds }
      });

      if (error) {
        console.error('Failed to update lead scores via edge function:', error);
        return 0;
      }

      // Auto-insert to assigned_leads to populate CRM
      const assignedLeadInserts = [];
      const newLeadIds = leadsToScore.filter(l => l.client_id).map(l => l.id);
      
      let existingAssigned = [];
      if (newLeadIds.length > 0) {
        const { data: assigned } = await supabase
          .from('assigned_leads')
          .select('lead_id')
          .in('lead_id', newLeadIds);
        existingAssigned = (assigned || []).map(a => a.lead_id);
      }

      for (const lead of leadsToScore) {
        if (lead.client_id && !existingAssigned.includes(lead.id)) {
          assignedLeadInserts.push({
            lead_id: lead.id,
            client_id: lead.client_id,
            status: 'New',
            is_contacted: false
          });
        }
      }

      if (assignedLeadInserts.length > 0) {
        const { error: assignError } = await supabase
          .from('assigned_leads')
          .insert(assignedLeadInserts);

        if (assignError) {
          console.error('Failed to insert assigned_leads for CRM:', assignError);
        }
      }

      return leadIds.length;
    } catch (err) {
      console.error('Error invoking scoring function:', err);
      return 0;
    }
  }
};
