export interface WindowProbabilities {
    prob30Day: number;
    prob90Day: number;
    prob180Day: number;
    recommendedWindow: '30-day' | '90-day' | '180-day';
}

export class ProbabilityWindowService {
    /**
     * Spreads the baseline purchase probability across 30, 90, and 180 day windows.
     * Heuristic rules:
     * High Timing Score (> 20) -> Skews heavily to 30 days.
     * Medium Timing Score (10-20) -> Skews to 90 days.
     * Low Timing Score (< 10) -> Skews to 180 days.
     */
    static calculateWindowDistribution(baseProbability: number, timingScore: number): WindowProbabilities {
        let prob30Day = 0;
        let prob90Day = 0;
        let prob180Day = 0;
        let recommendedWindow: '30-day' | '90-day' | '180-day' = '180-day';

        // The base probability represents the chance they will buy AT ALL (within 180 days).
        prob180Day = baseProbability;

        if (timingScore >= 20) {
            // High urgency (e.g. active tender, immediate need)
            prob30Day = baseProbability * 0.8; // 80% of the probability falls in the first 30 days
            prob90Day = baseProbability * 0.95; 
            recommendedWindow = '30-day';
        } else if (timingScore >= 10) {
            // Medium urgency (e.g. researching, project planned)
            prob30Day = baseProbability * 0.3;
            prob90Day = baseProbability * 0.75;
            recommendedWindow = '90-day';
        } else {
            // Low urgency / passive
            prob30Day = baseProbability * 0.1;
            prob90Day = baseProbability * 0.4;
            recommendedWindow = '180-day';
        }

        return {
            prob30Day: Math.round(prob30Day * 100) / 100,
            prob90Day: Math.round(prob90Day * 100) / 100,
            prob180Day: Math.round(prob180Day * 100) / 100,
            recommendedWindow
        };
    }
}
