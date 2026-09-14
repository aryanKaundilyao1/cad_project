// src/services/intelligence/decision/analytics/DecisionExplainabilityEngine.ts

export class DecisionExplainabilityEngine {
    
    /**
     * Generates a full causal chain trace for a recommendation.
     */
    static generateFullTrace(data: any): string {
        return `Signal Trigger: ${data.signalName}
↓
Timing Score = ${data.timingScore}
↓
Probability = ${data.probabilityScore}%
↓
Confidence = ${data.confidenceScore}%
↓
Contact = ${data.contactRole}
↓
Product = ${data.productName}
↓
Playbook = ${data.playbookName}
↓
Action = ${data.action}`;
    }
}
