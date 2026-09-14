// src/services/intelligence/decision/acceleration/StallDetectionEngine.ts

export interface StallDetectionResult {
    stallRisk: number;
    status: string;
    isStalled: boolean;
}

export class StallDetectionEngine {
    
    /**
     * Calculates the risk of an opportunity being stalled based on its stage duration.
     * Formula: StallRisk = (DaysInStage / AverageDaysForStage) * 100
     */
    static detectStall(daysInStage: number, expectedDays: number): StallDetectionResult {
        if (expectedDays <= 0) {
            return { stallRisk: 0, status: 'Healthy', isStalled: false };
        }

        const stallRisk = (daysInStage / expectedDays) * 100;
        let status = 'Healthy';
        let isStalled = false;

        if (stallRisk > 120) {
            status = 'Stalled';
            isStalled = true;
        } else if (stallRisk > 100) {
            status = 'At Risk';
        } else if (stallRisk > 80) {
            status = 'Monitor';
        }

        return {
            stallRisk: Math.round(stallRisk * 100) / 100,
            status,
            isStalled
        };
    }
}
