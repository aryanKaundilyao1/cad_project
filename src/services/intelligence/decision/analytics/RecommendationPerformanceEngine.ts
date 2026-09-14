// src/services/intelligence/decision/analytics/RecommendationPerformanceEngine.ts

export interface PerformanceMetrics {
    winRate: number;
    conversionRate: number;
    revenueGenerated: number;
}

export class RecommendationPerformanceEngine {
    
    /**
     * Determines how effective adopted recommendations are at winning deals.
     */
    static calculatePerformance(
        wins: number, 
        losses: number, 
        revenueGenerated: number,
        totalFollowed: number
    ): PerformanceMetrics {
        
        const totalOutcomes = wins + losses;
        let winRate = 0;
        if (totalOutcomes > 0) {
            winRate = (wins / totalOutcomes) * 100;
        }

        let conversionRate = 0;
        if (totalFollowed > 0) {
            conversionRate = (wins / totalFollowed) * 100;
        }

        return {
            winRate: Math.round(winRate * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
            revenueGenerated
        };
    }
}
