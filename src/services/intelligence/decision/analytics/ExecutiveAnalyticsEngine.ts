// src/services/intelligence/decision/analytics/ExecutiveAnalyticsEngine.ts

export interface ExecutiveSummary {
    adoptionRate: number;
    revenueInfluenced: number;
    winRateLift: number;
    salesCycleReductionDays: number;
}

export class ExecutiveAnalyticsEngine {
    
    /**
     * Aggregates top-level metrics for leadership dashboards.
     */
    static generateSummary(data: any): ExecutiveSummary {
        return {
            adoptionRate: data.totalAdopted / data.totalGenerated * 100,
            revenueInfluenced: data.totalRevenueWonFromAI,
            winRateLift: data.aiWinRate - data.baselineWinRate,
            salesCycleReductionDays: data.baselineSalesCycleDays - data.aiSalesCycleDays
        };
    }
}
