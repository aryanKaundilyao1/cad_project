export class StakeholderCountEngine {
  /**
   * StakeholderCount_pts = min(14, 4 + 5×(distinct_engaged_contacts – 1))
   * 1 -> 4
   * 2 -> 9
   * 3+ -> 14
   */
  static evaluate(distinctEngagedContacts: number): number {
    if (distinctEngagedContacts <= 0) return 0;
    
    const score = 4 + 5 * (distinctEngagedContacts - 1);
    
    return Math.min(14, score);
  }
}
