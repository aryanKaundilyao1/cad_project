export class IntentClassificationEngine {
  /**
   * Evaluates the user's input to determine the core intent.
   * This drives which ContextProviders are fired.
   */
  static classifyIntent(userMessage: string): string {
    const lowercaseMsg = userMessage.toLowerCase();
    
    if (lowercaseMsg.includes('risk') || lowercaseMsg.includes('block') || lowercaseMsg.includes('stuck')) {
      return 'RISK_ANALYSIS';
    }
    
    if (lowercaseMsg.includes('meeting') || lowercaseMsg.includes('prep') || lowercaseMsg.includes('call')) {
      return 'MEETING_PREP';
    }

    if (lowercaseMsg.includes('revenue') || lowercaseMsg.includes('forecast') || lowercaseMsg.includes('commit')) {
      return 'REVENUE_ANALYSIS';
    }

    return 'GENERAL_SUMMARY';
  }
}
