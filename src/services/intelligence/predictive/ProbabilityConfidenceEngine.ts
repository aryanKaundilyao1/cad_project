export class ProbabilityConfidenceEngine {
    /**
     * Measures certainty by evaluating model agreement, signal volume, and data completeness.
     */
    static calculateConfidence(
        bayesianProb: number, 
        logisticProb: number, 
        gbmProb: number,
        signalCount: number
    ): { score: number, interval: string } {
        // Calculate model agreement (variance)
        const mean = (bayesianProb + logisticProb + gbmProb) / 3;
        const variance = Math.pow(bayesianProb - mean, 2) + Math.pow(logisticProb - mean, 2) + Math.pow(gbmProb - mean, 2);
        
        // High variance = low agreement = lower confidence
        // Few signals = lower confidence
        let score = 100 - (variance * 1000); 
        
        if (signalCount < 3) score -= 20;

        score = Math.max(0, Math.min(100, score));

        const margin = Math.max(2, Math.round((100 - score) / 5));

        return {
            score: Math.round(score),
            interval: `±${margin}%`
        };
    }
}
