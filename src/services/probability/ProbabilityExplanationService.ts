import { ProbabilityDriverService } from "./ProbabilityDriverService";
import { PurchaseProbabilityProfileService } from "./PurchaseProbabilityProfileService";

export class ProbabilityExplanationService {
  /**
   * Generates a human-readable explanation of the current probability score.
   */
  static async explainProbability(opportunityId: string): Promise<string> {
    const profile = await PurchaseProbabilityProfileService.getProfileByOpportunity(opportunityId);
    if (!profile) return "No probability profile found.";

    const drivers = await ProbabilityDriverService.getDriversByOpportunity(opportunityId);

    const positiveDrivers = drivers.filter(d => d.driver_type === 'POSITIVE' || d.driver_type === 'ACCELERATOR');
    const negativeDrivers = drivers.filter(d => d.driver_type === 'NEGATIVE' || d.driver_type === 'RISK' || d.driver_type === 'BLOCKER');

    let explanation = `Purchase Probability: ${profile.win_probability ?? 0}%\n`;
    explanation += `Confidence: ${profile.confidence_score ?? 0}%\n`;
    explanation += `Trend: ${profile.trend_status ?? 'STABLE'}\n\n`;

    if (positiveDrivers.length > 0) {
      explanation += `Positive Drivers:\n`;
      positiveDrivers.forEach(d => {
        explanation += `- [${d.source_engine}] ${d.description}\n`;
      });
      explanation += `\n`;
    }

    if (negativeDrivers.length > 0) {
      explanation += `Negative Drivers:\n`;
      negativeDrivers.forEach(d => {
        explanation += `- [${d.source_engine}] ${d.description}\n`;
      });
      explanation += `\n`;
    }

    if (drivers.length === 0) {
      explanation += `No significant drivers detected yet.\n`;
    }

    return explanation;
  }
}
