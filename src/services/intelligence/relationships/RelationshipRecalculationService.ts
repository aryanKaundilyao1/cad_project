import { supabase } from "@/integrations/supabase/client";
import { StakeholderRelationshipGraphEngine } from "./StakeholderRelationshipGraphEngine";
import { InfluencePathEngine } from "./InfluencePathEngine";
import { StakeholderNetworkHealthEngine } from "./StakeholderNetworkHealthEngine";
import { StakeholderAccessEngine } from "./StakeholderAccessEngine";
import { StakeholderProfileService } from "../stakeholders/StakeholderProfileService";

export class RelationshipRecalculationService {
  /**
   * Rebuilds the in-memory graph and scans for new insights.
   * Typically triggered when a new structural edge is drawn (e.g. StakeholderRelationship inserted).
   */
  static async recalculateNetwork(opportunityId: string, knownDecisionMakerId?: string) {
    // 1. Fetch all nodes (profiles)
    const profiles = await StakeholderProfileService.getProfilesByOpportunity(opportunityId);

    // 2. Fetch all edges (relationships)
    const { data: relationshipsData, error: relError } = await supabase
      .from('stakeholder_relationships')
      .select('*, source_profile_id(*), target_profile_id(*)')
      .in('source_profile_id', profiles.map(p => p.id));
      
    if (relError) throw relError;

    // 3. Build Graph
    const graph = StakeholderRelationshipGraphEngine.buildGraph(profiles, relationshipsData as any[]);

    // 4. Run Engines
    const risks = StakeholderNetworkHealthEngine.analyzeHealth(graph, knownDecisionMakerId);
    
    let bestEntryPoint = null;
    if (knownDecisionMakerId) {
       bestEntryPoint = StakeholderAccessEngine.findBestEntryPoint(graph, knownDecisionMakerId);
    }

    // 5. Persist Insights
    for (const risk of risks) {
      await supabase.from('relationship_insights').insert({
        opportunity_id: opportunityId,
        insight_type: 'NETWORK_RISK',
        evidence: { type: risk.type, description: risk.description, nodes: risk.nodeIds },
        confidence_score: 90 // Structural logic is highly confident
      });
    }

    if (bestEntryPoint && bestEntryPoint.entryNodeId) {
      await supabase.from('relationship_insights').insert({
        opportunity_id: opportunityId,
        insight_type: 'ACCESS_ROUTE',
        primary_stakeholder_id: bestEntryPoint.entryNodeId,
        target_stakeholder_id: knownDecisionMakerId,
        evidence: { path: bestEntryPoint.path, reason: bestEntryPoint.reason },
        confidence_score: 85
      });
    }

    return { graph, risks, bestEntryPoint };
  }
}
