export class ContextRelevanceEngine {
  /**
   * Filters the total pool of intelligence context based on the user's intent.
   * If the user asks about risk, we drop revenue history and keep blockers.
   */
  static filterRelevantContext(rawContextBlocks: any[], intentType: string) {
    if (intentType === 'RISK_ANALYSIS') {
      // Prioritize Risk, Blockers, Action Contexts. 
      // In a real implementation, this would use a mapping dictionary.
      return rawContextBlocks.filter(block => 
        ['ACTION_INTELLIGENCE', 'DECISION_RISK', 'OPPORTUNITY_BASELINE'].includes(block.type)
      );
    }
    
    if (intentType === 'MEETING_PREP') {
      return rawContextBlocks.filter(block => 
        ['STAKEHOLDER_INTELLIGENCE', 'COMMITTEE_HEALTH', 'OPPORTUNITY_BASELINE'].includes(block.type)
      );
    }

    // Default: return everything for a GENERAL_SUMMARY
    return rawContextBlocks;
  }
}
