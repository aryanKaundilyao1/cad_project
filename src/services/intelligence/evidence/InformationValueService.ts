export class InformationValueService {
    /**
     * Calculates Information Value (IV) for a specific signal.
     * IV = (P(signal | Won) - P(signal | Lost)) * WOE
     */
    static calculateIV(
        signalWon: number,
        signalLost: number,
        totalSystemWon: number,
        totalSystemLost: number,
        woe: number
    ): number {
        const safeSignalWon = signalWon === 0 ? 0.5 : signalWon;
        const safeSignalLost = signalLost === 0 ? 0.5 : signalLost;

        const pSignalGivenWon = safeSignalWon / totalSystemWon;
        const pSignalGivenLost = safeSignalLost / totalSystemLost;

        const iv = (pSignalGivenWon - pSignalGivenLost) * woe;
        return Math.round(iv * 1000) / 1000;
    }

    /**
     * Classifies the IV score into predictive strength.
     */
    static classifyIV(iv: number): 'Not Predictive' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong' {
        if (iv < 0.02) return 'Not Predictive';
        if (iv < 0.1) return 'Weak';
        if (iv < 0.3) return 'Medium';
        if (iv < 0.5) return 'Strong';
        return 'Very Strong';
    }
}
