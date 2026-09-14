import { GraphNode } from "./StakeholderRelationshipGraphEngine";

export interface PathInsight {
  path: string[]; // Array of Stakeholder Profile IDs
  totalWeight: number; // Lower is better (least resistance)
  confidence: number;
}

export class InfluencePathEngine {
  /**
   * Uses Dijkstra's algorithm to find the path of least resistance 
   * between a source stakeholder and a target stakeholder.
   */
  static findOptimalPath(graph: Map<string, GraphNode>, sourceId: string, targetId: string): PathInsight | null {
    if (!graph.has(sourceId) || !graph.has(targetId)) return null;

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const nodeId of graph.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current = null;
      let minDistance = Infinity;
      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          current = nodeId;
        }
      }

      if (current === null || current === targetId) break;

      unvisited.delete(current);

      const node = graph.get(current)!;

      for (const edge of node.edges) {
        if (!unvisited.has(edge.targetNodeId)) continue;
        
        // Edge weight calculation (lower is better for Dijkstra)
        // Base weight is inverted relationship strength (10 strength = 1 weight)
        let edgeWeight = 11 - edge.relationship.strength;
        
        // Penalize blocked paths heavily
        if (edge.relationship.relationship_type === 'BLOCKED_BY') {
          edgeWeight += 50; 
        }

        const targetProfile = graph.get(edge.targetNodeId)!.profile;
        
        // Reward highly accessible nodes
        const accessibilityDiscount = (targetProfile.accessibility_score / 100) * 2;
        edgeWeight = Math.max(1, edgeWeight - accessibilityDiscount);

        const newDist = distances.get(current)! + edgeWeight;

        if (newDist < distances.get(edge.targetNodeId)!) {
          distances.set(edge.targetNodeId, newDist);
          previous.set(edge.targetNodeId, current);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = targetId;
    
    if (previous.get(targetId) === null) {
      return null; // No path exists
    }

    while (curr !== null) {
      path.unshift(curr);
      curr = previous.get(curr)!;
    }

    return {
      path,
      totalWeight: distances.get(targetId)!,
      confidence: 85 // Approximation based on existence of clear path
    };
  }
}
