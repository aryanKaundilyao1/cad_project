export class DecisionMomentumEngine {
  /**
   * Evaluates the velocity of the decision process.
   */
  static evaluate(
    daysSinceLastMilestone: number,
    daysSinceCreation: number
  ): { state: 'ACCELERATING' | 'STABLE' | 'STAGNANT' | 'REGRESSING', evidence: string[] } {
    const evidence: string[] = [];
    let state: 'ACCELERATING' | 'STABLE' | 'STAGNANT' | 'REGRESSING' = 'STABLE';

    if (daysSinceCreation === 0) {
       evidence.push('Decision just created. Initializing momentum.');
       return { state: 'STABLE', evidence };
    }

    if (daysSinceLastMilestone > 30) {
      state = 'STAGNANT';
      evidence.push(`No milestones completed in the last ${daysSinceLastMilestone} days.`);
    } else if (daysSinceLastMilestone <= 7) {
      state = 'ACCELERATING';
      evidence.push(`High velocity: A milestone was completed ${daysSinceLastMilestone} days ago.`);
    } else {
      evidence.push(`Steady progress over the last month.`);
    }

    return { state, evidence };
  }
}
