// src/services/intelligence/decision/acceleration/FollowUpEngine.ts

export interface FollowUpRecommendation {
    daysToWait: number;
    recommendedAction: string;
}

export class FollowUpEngine {
    
    /**
     * Recommends the optimal wait time and action for the next follow-up.
     * Formula: DaysToWait = BaseCadence - (EngagementScore * 0.10)
     */
    static recommendFollowUp(engagementScore: number, lastResponseType: string): FollowUpRecommendation {
        let baseCadence = 7; // Default 1 week
        let recommendedAction = 'Email';

        if (lastResponseType === 'MEETING') {
            baseCadence = 3;
            recommendedAction = 'Meeting Request';
        } else if (lastResponseType === 'PROPOSAL_SENT') {
            baseCadence = 5;
            recommendedAction = 'Proposal Follow-Up';
        }

        // Highly engaged accounts get followed up faster
        let daysToWait = baseCadence - (engagementScore * 0.10);
        daysToWait = Math.max(1, Math.round(daysToWait)); // Minimum 1 day

        if (engagementScore < 10) {
            recommendedAction = 'Executive Outreach';
            daysToWait = 14; // Give them space, but escalate
        }

        return {
            daysToWait,
            recommendedAction
        };
    }
}
