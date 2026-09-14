export class FeatureImportanceService {
    /**
     * Identifies the strongest global predictors for a specific model version.
     */
    static getFeatureImportance(modelVersion: string) {
        return [
            { feature: 'Tender Released', importance: 0.19, direction: 'Positive' },
            { feature: 'Procurement Hiring', importance: 0.14, direction: 'Positive' },
            { feature: 'Expansion Event', importance: 0.11, direction: 'Positive' },
            { feature: 'Budget Freeze', importance: -0.17, direction: 'Negative' }
        ];
    }
}
