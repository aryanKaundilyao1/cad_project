import { StakeholderProfile, StakeholderRelationship } from "../stakeholders/StakeholderTypes";

export interface GraphNode {
  profile: StakeholderProfile;
  edges: GraphEdge[];
}

export interface GraphEdge {
  targetNodeId: string;
  relationship: StakeholderRelationship;
}

export class StakeholderRelationshipGraphEngine {
  /**
   * Builds an in-memory directed graph (adjacency list) for a specific opportunity.
   */
  static buildGraph(profiles: StakeholderProfile[], relationships: StakeholderRelationship[]): Map<string, GraphNode> {
    const graph = new Map<string, GraphNode>();

    // 1. Initialize Nodes
    for (const profile of profiles) {
      graph.set(profile.id, {
        profile,
        edges: []
      });
    }

    // 2. Map Edges
    for (const rel of relationships) {
      const sourceNode = graph.get(rel.source_profile_id);
      if (sourceNode) {
        sourceNode.edges.push({
          targetNodeId: rel.target_profile_id,
          relationship: rel
        });
      }
    }

    return graph;
  }
}
