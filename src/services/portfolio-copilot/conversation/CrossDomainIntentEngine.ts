export class CrossDomainIntentEngine {
  /**
   * Determines what sub-graphs need to be pulled based on the user's question.
   */
  static detectIntent(message: string) {
    if (message.includes("approval delays") && message.includes("revenue risk")) {
      return 'CROSS_DOMAIN_ACTION_REVENUE';
    }
    return 'UNKNOWN';
  }
}
