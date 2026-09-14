import { ActionRuleEngine, EngineContext } from './rules/ActionRuleEngine';

export class NextBestActionEngine {
    
    /**
     * Determines the optimal next action based on context and confidence multipliers.
     * Formula: ActionScore = max(Signal_Urgency_Weight) * ConfidenceMultiplier
     */
    static calculateNextBestAction(context: EngineContext, maxSignalUrgencyWeight: number = 50) {
        // 1. Get Confidence Multiplier
        let multiplier = 0.50; // Default for < 60
        if (context.confidence >= 90) multiplier = 1.20;
        else if (context.confidence >= 75) multiplier = 1.00;
        else if (context.confidence >= 60) multiplier = 0.80;

        // 2. Base Action Score Calculation
        let actionScore = maxSignalUrgencyWeight * multiplier;
        actionScore = Math.min(100, Math.max(0, actionScore)); // Cap 0-100

        // 3. Evaluate Rule Engine to get specific Action
        const ruleResult = ActionRuleEngine.evaluate(context);

        return {
            actionScore,
            confidenceMultiplier: multiplier,
            recommendedAction: ruleResult.recommendedAction,
            reasonCodes: ruleResult.reasonCodes
        };
    }
}
