// src/services/intelligence/decision/acceleration/DealExplainabilityEngine.ts

import { DealHealthResult } from './DealHealthEngine';
import { Intervention } from './InterventionRecommendationEngine';

export class DealExplainabilityEngine {
    
    static explainDealHealth(health: DealHealthResult, recentActivityDays: number, engagementScore: number): string {
        let text = `Deal Health: ${health.healthScore.toFixed(1)} (${health.status})\nBecause:\n`;

        if (recentActivityDays > 21) {
            text += `- No Meetings or meaningful activity in ${recentActivityDays} Days.\n`;
        }
        if (engagementScore < 30) {
            text += `- Stakeholder Engagement has significantly declined.\n`;
        }
        if (health.status === 'Healthy') {
            text += `- High probability and consistent pipeline progress.\n`;
        }
        
        return text.trim();
    }

    static explainIntervention(intervention: Intervention): string {
        let text = `Acceleration Recommendation: ${intervention.interventionType}\nBecause:\n`;
        
        if (intervention.reasonCodes.includes('DEAL_STALLED')) {
            text += `- The deal has exceeded the expected time for the current stage.\n`;
        }
        if (intervention.reasonCodes.includes('MULTI_THREAD_REQUIRED')) {
            text += `- High dependency on a single contact; need to engage broader buying committee.\n`;
        }
        if (intervention.reasonCodes.includes('COMPETITION_DETECTED')) {
            text += `- Strong signals indicate active competitor involvement.\n`;
        }
        if (intervention.reasonCodes.includes('BUDGET_RISK')) {
            text += `- Signals suggest potential budget constraints or freezing.\n`;
        }
        if (intervention.reasonCodes.includes('EXECUTIVE_REQUIRED')) {
            text += `- Deal requires executive-to-executive alignment to unblock.\n`;
        }
        
        return text.trim();
    }
}
