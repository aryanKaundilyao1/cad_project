export class BayesianProbabilityEngine {
    /**
     * Calculates Posterior Odds = Prior Odds × BF_1 × BF_2 ...
     * Then converts back to Probability.
     */
    static calculateProbability(priorProbability: number, bayesFactors: number[]): number {
        // P -> Odds: O = P / (1 - P)
        const priorOdds = priorProbability / (1 - priorProbability);
        
        let posteriorOdds = priorOdds;
        for (const bf of bayesFactors) {
            posteriorOdds *= bf;
        }

        // Odds -> P: P = O / (1 + O)
        return posteriorOdds / (1 + posteriorOdds);
    }
}
