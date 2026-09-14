import { GraphNode } from "./StakeholderRelationshipGraphEngine";
import { InfluencePathEngine } from "./InfluencePathEngine";

export interface NetworkRisk {
  type: 'SINGLE_POINT_OF_FAILURE' | 'ISOLATED_INFLUENCER' | 'NO_DECISION_MAKER';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  nodeIds: string[];
}

export class StakeholderNetworkHealthEngine {
  /**
   * Scans the graph for structural risks.
   */
  static analyzeHealth(graph: Map<string, GraphNode>, decisionMakerId?: string): NetworkRisk[] {
    const risks: NetworkRisk[] = [];

    if (!decisionMakerId || !graph.has(decisionMakerId)) {
      risks.push({
        type: 'NO_DECISION_MAKER',
        severity: 'HIGH',
        description: 'No decision maker has been identified or linked to the committee.',
        nodeIds: []
      });
      return risks;
    }

    // Check for Single Point of Failure
    // If all paths to the DM pass through exactly one node (who isn't the DM)
    let pathsToDM = 0;
    const directConnections = [];
    
    for (const [nodeId, node] of graph.entries()) {
      if (nodeId === decisionMakerId) continue;
      
      const hasDirect = node.edges.some(e => e.targetNodeId === decisionMakerId);
      if (hasDirect) {
        pathsToDM++;
        directConnections.push(nodeId);
      }
    }

    if (pathsToDM === 1) {
      risks.push({
        type: 'SINGLE_POINT_OF_FAILURE',
        severity: 'HIGH',
        description: 'Only one direct structural path to the Decision Maker exists.',
        nodeIds: [directConnections[0]]
      });
    }

    // Check for Isolated Influencers
    // High influence score but zero outbound edges
    for (const [nodeId, node] of graph.entries()) {
      if (nodeId === decisionMakerId) continue;
      
      if (node.profile.influence_score > 70 && node.edges.length === 0) {
        risks.push({
          type: 'ISOLATED_INFLUENCER',
          severity: 'MEDIUM',
          description: 'Highly influential stakeholder with no mapped connections to the broader committee.',
          nodeIds: [nodeId]
        });
      }
    }

    return risks;
  }
}
