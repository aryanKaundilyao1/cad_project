// src/services/intelligence/decision/analytics/PlaybookPerformanceEngine.ts

export interface PlaybookMetrics {
    conversionRate: number;
    averageSalesCycle: number;
}

export class PlaybookPerformanceEngine {
    
    /**
     * Evaluates specific playbooks for their effectiveness in reducing sales cycles and increasing deal size.
     */
    static evaluatePlaybook(
        wins: number, 
        executions: number, 
        totalDaysToClose: number
    ): PlaybookMetrics {
        
        let conversionRate = 0;
        if (executions > 0) {
            conversionRate = (wins / executions) * 100;
        }

        let averageSalesCycle = 0;
        if (wins > 0) {
            averageSalesCycle = totalDaysToClose / wins;
        }

        return {
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageSalesCycle: Math.round(averageSalesCycle)
        };
    }
}
