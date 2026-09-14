export class StakeholderSeniorityEngine {
  /**
   * SeniorityWeight_pts = 6 × (Σ role_weight_i / n_contacts)
   * role_weight: C-suite/VP=1.0, Director/Manager=0.7, Individual contributor=0.4
   */
  static evaluate(contactRoles: string[]): number {
    if (!contactRoles || contactRoles.length === 0) return 0;
    
    let totalWeight = 0;
    
    for (const role of contactRoles) {
      const lowerRole = role.toLowerCase();
      if (lowerRole.includes('ceo') || lowerRole.includes('owner') || lowerRole.includes('founder') || lowerRole.includes('vp') || lowerRole.includes('chief') || lowerRole.includes('head')) {
        totalWeight += 1.0;
      } else if (lowerRole.includes('director') || lowerRole.includes('manager')) {
        totalWeight += 0.7;
      } else {
        totalWeight += 0.4;
      }
    }
    
    const avgWeight = totalWeight / contactRoles.length;
    const raw = 6 * avgWeight;
    
    return Math.round(raw * 100) / 100;
  }
}
