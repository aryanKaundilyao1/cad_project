export class RevenueCopilotCalibrationService {
  /**
   * Ensures the LLM outputs use appropriate industry terminology (e.g. EPC, Fit-Out)
   * and calibrate the severity thresholds for insights.
   */
  static calibrateForIndustry(industry: string) {
    if (industry === 'EPC') {
      return {
        vocabulary: ['milestone billing', 'procurement delays'],
        riskThresholdMultiplier: 1.2
      };
    }
    return {
      vocabulary: [],
      riskThresholdMultiplier: 1.0
    };
  }
}
