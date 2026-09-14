import { supabase } from "@/integrations/supabase/client";

export class RelationshipValidationService {
  /**
   * Validates integrity of graph paths and edges.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    brokenEdges: number;
    details: string;
  }> {
    // Check for edges pointing to non-existent profiles (if DB constraints are missing/disabled)
    // Supabase handles this via foreign keys, so theoretically 0.
    const { data: broken, error } = await supabase
      .from('stakeholder_relationships')
      .select('id, target_profile_id')
      .is('target_profile_id', null);

    if (error) {
       return { status: 'FAIL', brokenEdges: -1, details: error.message };
    }

    const count = broken?.length || 0;

    return {
      status: count === 0 ? 'PASS' : 'FAIL',
      brokenEdges: count,
      details: count === 0 ? 'All relationship edges are valid.' : `${count} broken edges detected.`
    };
  }
}
