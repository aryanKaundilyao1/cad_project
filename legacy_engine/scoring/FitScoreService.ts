import { OpportunityScoringContext } from "./OpportunityScoringContext";
import { ScoreExplanationService, ScoreExplanation, ScoreFactor, ScoreConfidence } from "./ScoreExplanationService";
import { IndustryMatchEngine } from "./IndustryMatchEngine";
import { SizeMatchEngine } from "./SizeMatchEngine";
import { GeoMatchEngine } from "./GeoMatchEngine";
import { TechCompatibilityEngine } from "./TechCompatibilityEngine";
import { FinancialHealthEngine } from "./FinancialHealthEngine";

export class FitScoreService {
  static readonly CURRENT_VERSION = 'v2.0-fit';

  /**
   * Calculates the Fit Score using the standardized Context.
   */
  static calculateFitScore(context: OpportunityScoringContext): ScoreExplanation {
    const evidence: string[] = [];
    const factors: ScoreFactor[] = [];
    
    // Safely extract from context
    const account = context.account || {};
    const industry = account.industry || account.inferred_industry || null;
    const revenue = account.revenue || null;
    const headcount = account.headcount || account.employees || null;
    const geo = account.hq_location || account.country || null;
    const tech = account.tech_stack || null;
    const financial = account.financial_health || account.funding_stage || null;

    // Run sub-engines
    const indScore = IndustryMatchEngine.evaluate(industry);
    const sizeScore = SizeMatchEngine.evaluate(revenue, headcount);
    const geoScore = GeoMatchEngine.evaluate(geo);
    const techScore = TechCompatibilityEngine.evaluate(tech);
    const finScore = FinancialHealthEngine.evaluate(financial);

    // Calculate sum (max 25 based on matrix)
    const fitRaw = Math.min(25, indScore + sizeScore + geoScore + techScore + finScore);

    // Evaluate factors and evidence
    let missingCritical = 0;
    let missingMinor = 0;

    if (industry) {
      factors.push({ name: "Industry Match", value: indScore, max: 6 });
      evidence.push(`Industry mapped as '${industry}' scoring ${indScore} points.`);
    } else {
      missingCritical++;
      evidence.push("Missing Industry data.");
    }

    if (revenue || headcount) {
      factors.push({ name: "Size Match", value: sizeScore, max: 8 });
      evidence.push(`Size metrics available scoring ${sizeScore} points.`);
    } else {
      missingCritical++;
      evidence.push("Missing Headcount and Revenue data.");
    }

    if (geo) {
      factors.push({ name: "Geo Match", value: geoScore, max: 5 });
      evidence.push(`Geography mapped as '${geo}' scoring ${geoScore} points.`);
    } else {
      missingMinor++;
      evidence.push("Missing Geographic data.");
    }

    factors.push({ name: "Tech Match", value: techScore, max: 3 });
    factors.push({ name: "Financial Health", value: finScore, max: 3 });

    if (!tech) missingMinor++;
    if (!financial) missingMinor++;

    // Determine Confidence
    const confidence = ScoreExplanationService.determineConfidence(missingCritical, missingMinor);

    // If completely uncalculable, do not abort, just degrade score.
    if (confidence === "Insufficient Data") {
      evidence.push("Degrading score due to insufficient data.");
    }

    return ScoreExplanationService.buildExplanation(
      fitRaw,
      factors,
      [], // Weights are applied at the Master level
      evidence,
      confidence
    );
  }
}
