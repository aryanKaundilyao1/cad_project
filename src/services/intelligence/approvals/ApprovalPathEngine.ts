export class ApprovalPathEngine {
  /**
   * Determines the critical path through the approval chain.
   */
  static calculatePath(
    steps: any[],
    isParallel: boolean
  ): { critical_path: string[], path_health: number, evidence: string[] } {
    const evidence: string[] = [];
    
    // Sort steps by step_order
    const orderedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);
    const criticalPath = orderedSteps.filter(s => s.required).map(s => s.id);
    
    if (isParallel) {
      evidence.push(`Parallel approval flow: ${criticalPath.length} required steps must be completed concurrently.`);
    } else {
      evidence.push(`Sequential approval flow: ${criticalPath.length} required steps must be completed in order.`);
    }

    return { 
      critical_path: criticalPath, 
      path_health: 100, // Starting health, can be degraded by Dependency/Risk engines
      evidence 
    };
  }
}
