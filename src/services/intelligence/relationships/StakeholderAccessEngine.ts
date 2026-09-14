import { GraphNode } from "./StakeholderRelationshipGraphEngine";
import { InfluencePathEngine } from "./InfluencePathEngine";

export class StakeholderAccessEngine {
  /**
   * Identifies the best entry point to reach a specific target stakeholder
   * by finding the most accessible node that has a clear path to the target.
   */
  static findBestEntryPoint(graph: Map<string, GraphNode>, targetId: string): { 
    entryNodeId: string | null; 
    path: string[];
    reason: string;
  } {
    let bestEntryNode: string | null = null;
    let bestPath: string[] = [];
    let lowestWeight = Infinity;

    // Evaluate every node as a potential starting point
    for (const [nodeId, node] of graph.entries()) {
      if (nodeId === targetId) continue;
      
      // We only want to enter through accessible people (score > 60)
      if (node.profile.accessibility_score < 60) continue;

      const insight = InfluencePathEngine.findOptimalPath(graph, nodeId, targetId);
      
      if (insight && insight.totalWeight < lowestWeight) {
        lowestWeight = insight.totalWeight;
        bestEntryNode = nodeId;
        bestPath = insight.path;
      }
    }

    if (bestEntryNode) {
      return {
        entryNodeId: bestEntryNode,
        path: bestPath,
        reason: `Node is highly accessible (score: ${graph.get(bestEntryNode)!.profile.accessibility_score}) and has the most efficient path to target.`
      };
    }

    return { entryNodeId: null, path: [], reason: "No highly accessible entry points found with a valid path to target." };
  }
}
