import { PortfolioContextPackagingPipeline } from "./PortfolioContextPackagingPipeline";

export class PortfolioContextService {
  /**
   * Primary entry point for Phase 10B.
   */
  static async loadContext(sessionId: string, scope: string) {
    return await PortfolioContextPackagingPipeline.buildAndPackage(sessionId, scope, 'EXECUTIVE');
  }
}
