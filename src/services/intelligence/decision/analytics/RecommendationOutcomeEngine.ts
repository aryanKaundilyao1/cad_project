// src/services/intelligence/decision/analytics/RecommendationOutcomeEngine.ts

export interface RecommendationOutcome {
    status: string;
    daysToOutcome: number;
    revenueGenerated: number;
}

export class RecommendationOutcomeEngine {
    
    /**
     * Links recommendation execution to pipeline outcomes.
     */
    static evaluateOutcome(dealStatus: string, expectedRevenue: number, recommendationDate: Date, outcomeDate: Date): RecommendationOutcome {
        
        let status = 'Pending';
        let revenueGenerated = 0;
        
        if (dealStatus === 'Closed Won') {
            status = 'Won';
            revenueGenerated = expectedRevenue;
        } else if (dealStatus === 'Closed Lost') {
            status = 'Lost';
        }

        const msInDay = 24 * 60 * 60 * 1000;
        const daysToOutcome = Math.round((outcomeDate.getTime() - recommendationDate.getTime()) / msInDay);

        return {
            status,
            daysToOutcome,
            revenueGenerated
        };
    }
}
