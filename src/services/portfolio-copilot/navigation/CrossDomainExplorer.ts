export class CrossDomainExplorer {
  /**
   * Handles jumping between domains (e.g. from an Action to a Revenue Forecast).
   */
  static async getAdjacentNodes(graphNodeId: string) {
    // MOCK: Query portfolio_graph_edges where source = graphNodeId or target = graphNodeId
    return [
      { id: "node_456", domain: "STAKEHOLDER", type: "INFLUENCES" }
    ];
  }
}
