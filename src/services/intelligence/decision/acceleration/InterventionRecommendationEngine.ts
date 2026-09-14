// src/services/intelligence/decision/acceleration/InterventionRecommendationEngine.ts

import { DealRisk } from './DealRiskEngine';
import { StallDetectionResult } from './StallDetectionEngine';

export interface Intervention {
    interventionType: string;
    priority: string;
    reasonCodes: string[];
}

export class InterventionRecommendationEngine {
    
    /**
     * Recommends high-level strategic interventions based on detected risks and stalls.
     */
    static recommendInterventions(risks: DealRisk[], stallResult: StallDetectionResult, daysSinceLastActivity: number): Intervention[] {
        const interventions: Intervention[] = [];

        // Rule 1: Competition Risk
        const compRisk = risks.find(r => r.riskType === 'Competition Risk');
        if (compRisk && compRisk.severity === 'High') {
            interventions.push({
                interventionType: 'Competitive Differentiation Campaign',
                priority: 'High',
                reasonCodes: ['COMPETITION_DETECTED']
            });
        }

        // Rule 2: Budget Risk
        const budgetRisk = risks.find(r => r.riskType === 'Budget Risk');
        if (budgetRisk) {
            interventions.push({
                interventionType: 'Budget Justification Package',
                priority: 'High',
                reasonCodes: ['BUDGET_RISK']
            });
        }

        // Rule 3: Stalled
        if (stallResult.isStalled) {
            interventions.push({
                interventionType: 'Multi-Thread Stakeholders',
                priority: 'High',
                reasonCodes: ['DEAL_STALLED', 'MULTI_THREAD_REQUIRED']
            });
        }

        // Rule 4: Ghosting / No Activity
        if (daysSinceLastActivity > 30) {
            interventions.push({
                interventionType: 'Escalate to Executive Sponsor',
                priority: 'Medium',
                reasonCodes: ['NO_RESPONSE', 'EXECUTIVE_REQUIRED']
            });
        }

        return interventions;
    }
}
