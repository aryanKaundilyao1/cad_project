export class PortfolioMemoryEngine {
  /**
   * Tracks the cross-domain context across conversation turns.
   */
  static getThreadContext(threadId: string) {
    // MOCK: fetch memory for thread
    return {
      previous_intents: ['REVENUE_RISK'],
      active_entities: ['EMEA', 'Q4']
    };
  }
}
