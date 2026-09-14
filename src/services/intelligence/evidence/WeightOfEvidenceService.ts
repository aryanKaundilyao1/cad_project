export class WeightOfEvidenceService {
    /**
     * Calculates Weight of Evidence (WOE).
     * WOE = ln( P(signal | Won) / P(signal | Lost) )
     * P(signal | Won) = (Occurrences in Won) / (Total Won Outcomes in system)
     * Laplace smoothing (+0.5) is applied to prevent divide-by-zero or ln(0).
     */
    static calculateWOE(
        signalWon: number,
        signalLost: number,
        totalSystemWon: number,
        totalSystemLost: number
    ): number {
        // Laplace smoothing
        const safeSignalWon = signalWon === 0 ? 0.5 : signalWon;
        const safeSignalLost = signalLost === 0 ? 0.5 : signalLost;
        
        const pSignalGivenWon = safeSignalWon / totalSystemWon;
        const pSignalGivenLost = safeSignalLost / totalSystemLost;
        
        const woe = Math.log(pSignalGivenWon / pSignalGivenLost);
        
        return Math.round(woe * 1000) / 1000;
    }

    /**
     * Calculates the Bayes Factor (BF) which is simply the Odds Ratio
     * without the logarithmic transformation.
     */
    static calculateBayesFactor(
        signalWon: number,
        signalLost: number,
        totalSystemWon: number,
        totalSystemLost: number
    ): number {
        const safeSignalWon = signalWon === 0 ? 0.5 : signalWon;
        const safeSignalLost = signalLost === 0 ? 0.5 : signalLost;
        
        const pSignalGivenWon = safeSignalWon / totalSystemWon;
        const pSignalGivenLost = safeSignalLost / totalSystemLost;
        
        const bf = pSignalGivenWon / pSignalGivenLost;
        return Math.round(bf * 1000) / 1000;
    }
}
