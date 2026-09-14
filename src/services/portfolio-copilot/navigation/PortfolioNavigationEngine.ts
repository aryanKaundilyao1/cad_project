import { CrossDomainExplorer } from "./CrossDomainExplorer";
import { NavigationAuditService } from "./NavigationAuditService";

export class PortfolioNavigationEngine {
  /**
   * Master orchestrator for visual traversal of the portfolio graph.
   */
  static async exploreNode(sessionId: string, userId: string, graphNodeId: string) {
    // 1. Audit the exploration
    await NavigationAuditService.logAccess(userId, graphNodeId);

    // 2. Fetch cross domain edges
    const relatedNodes = await CrossDomainExplorer.getAdjacentNodes(graphNodeId);

    return {
      activeNode: graphNodeId,
      relatedNodes
    };
  }
}
