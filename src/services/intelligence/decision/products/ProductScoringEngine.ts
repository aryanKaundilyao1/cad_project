// src/services/intelligence/decision/products/ProductScoringEngine.ts

export interface ProductScoringInputs {
    signalScore: number;
    intentScore: number;
    fitScore: number;
    timingScore: number;
    probabilityScore: number;
}

export class ProductScoringEngine {
    
    /**
     * Aggregates the various scores into a single Product Match Score.
     * Weights are configurable (hardcoded for this phase per requirements format, but could be fetched).
     */
    static calculateProductScore(inputs: ProductScoringInputs): number {
        // Example Weights
        const SIGNAL_WEIGHT = 0.40;
        const FIT_WEIGHT = 0.30;
        const INTENT_WEIGHT = 0.30;
        
        let score = (inputs.signalScore * SIGNAL_WEIGHT) + 
                    (inputs.fitScore * FIT_WEIGHT) + 
                    (inputs.intentScore * INTENT_WEIGHT);
                    
        return Math.min(100, score);
    }
}
