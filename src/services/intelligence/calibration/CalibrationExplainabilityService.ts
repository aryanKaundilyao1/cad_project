export class CalibrationExplainabilityService {
    /**
     * Explains the mathematical adjustment made by the active calibration model.
     */
    static explainAdjustment(rawProb: number, calibratedProb: number, modelType: string) {
        const diff = Math.round((calibratedProb - rawProb) * 100);
        const adjustmentString = diff > 0 ? `+${diff}%` : `${diff}%`;
        
        return {
            raw: rawProb,
            calibrated: calibratedProb,
            adjustment: adjustmentString,
            reason: `Adjusted by ${modelType} calibration model based on historical conversion curves.`
        };
    }
}
