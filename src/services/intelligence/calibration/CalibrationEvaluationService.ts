export class CalibrationEvaluationService {
    /**
     * Calculates the Brier Score (Mean Squared Error for probabilities).
     * Brier Score = (1/N) * sum( (PredictedProb - ActualOutcome)^2 )
     * Lower is better. Perfect score = 0.
     */
    static calculateBrierScore(predictions: { predicted: number, actual: number }[]): number {
        if (predictions.length === 0) return 0;
        
        const sumSquaredErrors = predictions.reduce((sum, p) => {
            return sum + Math.pow(p.predicted - p.actual, 2);
        }, 0);
        
        return sumSquaredErrors / predictions.length;
    }

    /**
     * Calculates Log Loss (Cross-Entropy).
     * Log Loss = -(1/N) * sum( actual * ln(predicted) + (1-actual) * ln(1-predicted) )
     * Lower is better. Heavily penalizes confident wrong predictions.
     */
    static calculateLogLoss(predictions: { predicted: number, actual: number }[]): number {
        if (predictions.length === 0) return 0;

        const eps = 1e-15; // Prevent ln(0)

        const sumLogLoss = predictions.reduce((sum, p) => {
            const pred = Math.max(eps, Math.min(1 - eps, p.predicted));
            return sum + (p.actual * Math.log(pred) + (1 - p.actual) * Math.log(1 - pred));
        }, 0);

        return -(sumLogLoss / predictions.length);
    }
}
