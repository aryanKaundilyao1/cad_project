// src/services/intelligence/decision/acceleration/DealHealthEngine.ts

export interface DealHealthInputs {
    probabilityScore: number;
    engagementScore: number;
    activityScore: number;
    stageProgressScore: number;
}

export interface DealHealthResult {
    healthScore: number;
    status: string;
}

export class DealHealthEngine {
    
    /**
     * Calculates overall deal health.
     * Formula: (Probability × 0.30) + (Engagement × 0.30) + (Activity × 0.20) + (StageProgress × 0.20)
     */
    static calculateHealth(inputs: DealHealthInputs): DealHealthResult {
        let score = 
            (inputs.probabilityScore * 0.30) +
            (inputs.engagementScore * 0.30) +
            (inputs.activityScore * 0.20) +
            (inputs.stageProgressScore * 0.20);
            
        score = Math.min(100, Math.max(0, score));
        
        let status = 'Dead';
        if (score >= 80) status = 'Healthy';
        else if (score >= 60) status = 'Watchlist';
        else if (score >= 40) status = 'At Risk';
        else if (score >= 20) status = 'Critical';
        
        return {
            healthScore: Math.round(score * 100) / 100,
            status
        };
    }
}
