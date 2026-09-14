import { OpportunityScoringContext } from "../OpportunityScoringContext";
import { ScoreExplanationService, ScoreExplanation, ScoreFactor, ScoreConfidence } from "../ScoreExplanationService";
import { TopicSurgeEngine } from "./TopicSurgeEngine";
import { FirstPartyIntentEngine } from "./FirstPartyIntentEngine";
import { ReviewActivityEngine } from "./ReviewActivityEngine";
import { SearchIntentEngine } from "./SearchIntentEngine";
import { SocialIntentEngine } from "./SocialIntentEngine";

export class IntentScoreService {
  static readonly CURRENT_VERSION = 'v2.0-intent';

  /**
   * Calculates the Intent Score using the standardized Context.
   */
  static calculateIntentScore(context: OpportunityScoringContext): ScoreExplanation {
    const evidence: string[] = [];
    const factors: ScoreFactor[] = [];
    
    // In Phase 3B, intent signals should be derived from the activities or signal events
    // mapped to the opportunity. For this foundation, we extract them from the context structure.
    
    // In a full implementation, we'd iterate over context.activities checking for specific intent types.
    // We mock the aggregation for now since the tables are sparse.
    const surgingTopicCount = 0;
    const surgeScores: number[] = [];
    let pricingPageVisits = 0;
    let demoRequests = 0;
    let specSheetDownloads = 0;
    let reviewSiteActivity = 0;
    let competitorComparisonActivity = 0;
    let socialEngagement = 0;

    // Simulate extraction from activities (Placeholder for actual signal mapping logic)
    if (context.activities && context.activities.length > 0) {
      context.activities.forEach(act => {
        if (act.activity_type === 'Page View' && act.description?.includes('Pricing')) pricingPageVisits++;
        if (act.activity_type === 'Form Fill' && act.description?.includes('Demo')) demoRequests++;
        // other mapping logic...
      });
    }

    // Run Sub-Engines
    const surgeScore = TopicSurgeEngine.evaluate(surgingTopicCount, surgeScores);
    const fpScore = FirstPartyIntentEngine.evaluate(pricingPageVisits, demoRequests, specSheetDownloads);
    const reviewScore = ReviewActivityEngine.evaluate(reviewSiteActivity);
    const searchScore = SearchIntentEngine.evaluate(competitorComparisonActivity);
    const socialScore = SocialIntentEngine.evaluate(socialEngagement);

    // Calculate Final Intent (Max 30)
    const intentRaw = Math.min(30, surgeScore + fpScore + reviewScore + searchScore + socialScore);

    // Evaluate factors and evidence
    let totalSignalsFound = 0;

    if (surgeScore > 0) {
      factors.push({ name: "Topic Surge", value: surgeScore, max: 10 });
      evidence.push(`Found ${surgingTopicCount} surging topics scoring ${surgeScore} points.`);
      totalSignalsFound++;
    }

    if (fpScore > 0) {
      factors.push({ name: "First-Party Intent", value: fpScore, max: 15 });
      evidence.push(`Recorded first-party actions scoring ${fpScore} points.`);
      totalSignalsFound++;
    }

    if (reviewScore > 0) {
      factors.push({ name: "Review Activity", value: reviewScore, max: 5 });
      evidence.push(`Review site activity detected scoring ${reviewScore} points.`);
      totalSignalsFound++;
    }

    if (searchScore > 0) {
      factors.push({ name: "Search Intent", value: searchScore, max: 5 });
      evidence.push(`Search intent detected scoring ${searchScore} points.`);
      totalSignalsFound++;
    }
    
    if (socialScore > 0) {
      factors.push({ name: "Social Intent", value: socialScore, max: 5 });
      evidence.push(`Social engagement detected scoring ${socialScore} points.`);
      totalSignalsFound++;
    }

    // Determine Confidence
    // For Intent, if NO tracking signals exist at all, we flag as Insufficient Data.
    // If they exist but are 0, score is 0. 
    // We assume if context.activities is empty, we have no tracking data.
    let confidence: ScoreConfidence = "High Confidence";
    
    if (!context.activities || context.activities.length === 0) {
      confidence = "Insufficient Data";
      evidence.push("No tracking signals or activities recorded.");
    } else if (totalSignalsFound === 0) {
      evidence.push("No actionable intent signals found.");
      confidence = "High Confidence"; // We are confident the intent is 0
    }

    if (confidence === "Insufficient Data") {
      evidence.push("Degrading score due to lack of tracking signals.");
    }

    return ScoreExplanationService.buildExplanation(
      intentRaw,
      factors,
      [],
      evidence,
      confidence
    );
  }
}
