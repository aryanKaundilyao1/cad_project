import { PortfolioContextBuilder } from "./PortfolioContextBuilder";
import { PortfolioCompressionEngine } from "./PortfolioCompressionEngine";
import { PortfolioContextPrioritizationEngine } from "./PortfolioContextPrioritizationEngine";
import { PortfolioSnapshotGenerator } from "./PortfolioSnapshotGenerator";

export class PortfolioContextPackagingPipeline {
  /**
   * The master flow for Phase 10B. 
   * Transforms thousands of opportunities into a token-optimized context payload.
   */
  static async buildAndPackage(sessionId: string, scope: string, level: 'EXECUTIVE' | 'MANAGEMENT') {
    // 1. Build Raw Context
    const rawContext = await PortfolioContextBuilder.buildContext(scope);

    // 2. Compress
    const compressedContext = PortfolioCompressionEngine.compress(rawContext, level);

    // 3. Prioritize
    const prioritizedContext = PortfolioContextPrioritizationEngine.prioritize(compressedContext);

    // 4. Snapshot
    const packageId = await PortfolioSnapshotGenerator.saveSnapshot(
      sessionId, 
      'EXECUTIVE_SUMMARY', 
      level, 
      prioritizedContext
    );

    return { packageId, payload: prioritizedContext };
  }
}
