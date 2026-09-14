import { GraphNode } from "./StakeholderRelationshipGraphEngine";

export class DecisionFlowEngine {
  /**
   * Identifies the primary decision chain by following APPROVES_FOR and REPORTS_TO edges
   * upwards from a given stakeholder (typically a Champion or Evaluator).
   */
  static traceDecisionChain(graph: Map<string, GraphNode>, startNodeId: string): string[] {
    const chain: string[] = [];
    let current = startNodeId;
    const visited = new Set<string>();

    while (current && !visited.has(current)) {
      chain.push(current);
      visited.add(current);

      const node = graph.get(current);
      if (!node) break;

      // Look for upward edges
      const parentEdge = node.edges.find(e => 
        e.relationship.relationship_type === 'APPROVES_FOR' || 
        e.relationship.relationship_type === 'REPORTS_TO'
      );

      if (parentEdge) {
        current = parentEdge.targetNodeId;
      } else {
        break; // Reached the top of the chain
      }
    }

    return chain;
  }
}
