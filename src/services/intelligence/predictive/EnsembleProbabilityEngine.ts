export class EnsembleProbabilityEngine {
    /**
     * Combines multiple probability outputs into a single mathematically weighted final probability.
     */
    static blendProbabilities(
        bayesianProb: number, 
        logisticProb: number, 
        gbmProb: number,
        weights = { bayesian: 0.2, logistic: 0.4, gbm: 0.4 }
    ): number {
        const finalProb = (bayesianProb * weights.bayesian) + 
                          (logisticProb * weights.logistic) + 
                          (gbmProb * weights.gbm);
                          
        return Math.max(0, Math.min(1, finalProb));
    }
}
