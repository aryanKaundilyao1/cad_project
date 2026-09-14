export class ApprovalBottleneckEngine {
  /**
   * Detects the specific step holding up the entire chain.
   */
  static evaluate(
    steps: any[],
    members: any[],
    isParallel: boolean
  ): { bottleneck_step_id: string | null, evidence: string[] } {
    const evidence: string[] = [];

    // Filter to only pending or rejected members
    const blockedMembers = members.filter(m => m.status === 'PENDING' || m.status === 'REJECTED');
    
    if (blockedMembers.length === 0) {
      return { bottleneck_step_id: null, evidence: [] };
    }

    let bottleneckMember = null;

    if (isParallel) {
      // In a parallel chain, the bottleneck is the oldest pending approval
      bottleneckMember = [...blockedMembers].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
    } else {
      // In sequential, it's the pending step with the lowest step_order
      const blockedSteps = steps.filter(s => blockedMembers.some(m => m.approval_step_id === s.id));
      const lowestStep = [...blockedSteps].sort((a, b) => a.step_order - b.step_order)[0];
      
      if (lowestStep) {
         bottleneckMember = blockedMembers.find(m => m.approval_step_id === lowestStep.id);
      }
    }

    if (bottleneckMember) {
      const step = steps.find(s => s.id === bottleneckMember.approval_step_id);
      evidence.push(`Bottleneck detected: Step "${step?.name}" is delaying the decision.`);
      return { bottleneck_step_id: bottleneckMember.approval_step_id, evidence };
    }

    return { bottleneck_step_id: null, evidence: [] };
  }
}
