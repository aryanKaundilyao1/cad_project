export class ForecastScenarioEngine {
  /**
   * Generates the financial scenarios for a forecast based on probability and confidence.
   */
  static calculateScenarios(baseAmount: number, winProbability: number, forecastConfidence: number) {
    // Pipeline Case: Unweighted total amount
    const pipelineCase = baseAmount;

    // Worst Case: Base minimum if applicable, else 0
    const worstCase = 0;

    // Expected Case: Probability-weighted amount
    const expectedCase = baseAmount * (winProbability / 100);

    // Best Case: If probability > 20%, we assume we could win it all
    const bestCase = winProbability > 20 ? baseAmount : expectedCase;

    // Commit Case: Heavily penalized by confidence and probability
    let commitCase = 0;
    if (winProbability >= 80) {
      // If highly probable, commit is the expected case modified by confidence
      commitCase = expectedCase * (forecastConfidence / 100);
    } else if (winProbability >= 50) {
      // If medium probable, commit is significantly reduced
      commitCase = expectedCase * 0.5 * (forecastConfidence / 100);
    }
    // If < 50%, commit is 0.

    return {
      pipeline_case: Math.round(pipelineCase),
      worst_case: Math.round(worstCase),
      expected_case: Math.round(expectedCase),
      best_case: Math.round(bestCase),
      commit_case: Math.round(commitCase)
    };
  }
}
