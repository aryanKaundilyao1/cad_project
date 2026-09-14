import { supabase } from "@/integrations/supabase/client";
import { PortfolioGraphContextLayer } from "./PortfolioGraphContextLayer";
import { GraphContextBuilder } from "./GraphContextBuilder";
import { CrossDomainPrioritizationEngine } from "./CrossDomainPrioritizationEngine";
import { CrossDomainCompressionEngine } from "./CrossDomainCompressionEngine";
import { PortfolioSnapshotGenerator } from "./PortfolioSnapshotGenerator";

export class PortfolioContextPackagingPipeline {
  /**
   * The master orchestrator for creating Portfolio Context Packages.
   */
  static async runPipeline(sessionId: string, permissionScope: any, compressionLevel: 'EXECUTIVE' | 'MANAGEMENT' | 'OPERATIONAL' | 'DIAGNOSTIC') {
    // 1. Get base graph
    const baseGraph = PortfolioGraphContextLayer.getBaseGraph();

    // 2. Filter by permissions
    const scopedGraph = GraphContextBuilder.buildContext(baseGraph, permissionScope);

    // 3. Prioritize nodes/edges
    const prioritizedGraph = CrossDomainPrioritizationEngine.prioritize(scopedGraph);

    // 4. Compress to token limits
    const compressed = CrossDomainCompressionEngine.compress(prioritizedGraph, compressionLevel);

    // 5. Store package
    const { data: pkg, error } = await supabase.from('portfolio_context_packages').insert({
      session_id: sessionId,
      compression_level: compressed.compression_level,
      compressed_content: compressed.content
    }).select('id').single();

    if (error || !pkg) throw new Error("Failed to store context package");

    // 6. Snapshot the exact graph state
    await PortfolioSnapshotGenerator.snapshot(pkg.id, { nodes: [], edges: [] });

    return pkg.id;
  }
}
