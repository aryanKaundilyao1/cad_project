export class ApprovalDependencyEngine {
  /**
   * Detects structural flaws like missing mandatory approvers in the chain.
   */
  static evaluate(
    steps: any[],
    members: any[]
  ): { valid: boolean, errors: string[], evidence: string[] } {
    let valid = true;
    const errors: string[] = [];
    const evidence: string[] = [];

    const requiredSteps = steps.filter(s => s.required);
    for (const step of requiredSteps) {
      const stepMembers = members.filter(m => m.approval_step_id === step.id);
      if (stepMembers.length === 0) {
        valid = false;
        errors.push(`Missing Approvers: Required step "${step.name}" has no stakeholders assigned.`);
      }
    }

    if (valid) {
      evidence.push(`All required approval steps have assigned stakeholders.`);
    } else {
      evidence.push(...errors);
    }

    return { valid, errors, evidence };
  }
}
