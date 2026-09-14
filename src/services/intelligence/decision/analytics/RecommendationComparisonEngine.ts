// src/services/intelligence/decision/analytics/RecommendationComparisonEngine.ts

export interface VersionComparison {
    versionA: string;
    versionB: string;
    winRateDifference: number;
    revenueDifference: number;
    adoptionRateDifference: number;
}

export class RecommendationComparisonEngine {
    
    /**
     * Compares the performance of two engine versions.
     */
    static compareVersions(metricsA: any, metricsB: any): VersionComparison {
        
        return {
            versionA: metricsA.versionId,
            versionB: metricsB.versionId,
            winRateDifference: Math.round((metricsB.winRate - metricsA.winRate) * 100) / 100,
            revenueDifference: metricsB.revenue - metricsA.revenue,
            adoptionRateDifference: Math.round((metricsB.adoptionRate - metricsA.adoptionRate) * 100) / 100,
        };
    }
}
