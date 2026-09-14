export class PredictionExplainabilityService {
    /**
     * Explains the ensemble breakdown.
     */
    static explainPrediction(final: number, bayesian: number, logistic: number, gbm: number, confidence: number) {
        return {
            final: `${Math.round(final * 100)}%`,
            generatedFrom: {
                bayesian: `${Math.round(bayesian * 100)}%`,
                logistic: `${Math.round(logistic * 100)}%`,
                gbm: `${Math.round(gbm * 100)}%`
            },
            confidence: `${confidence}%`
        };
    }
}
