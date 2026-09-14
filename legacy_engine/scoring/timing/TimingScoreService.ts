import { OpportunityScoringContext } from "../OpportunityScoringContext";
import { ScoreExplanationService, ScoreExplanation, ScoreFactor, ScoreConfidence } from "../ScoreExplanationService";
import { ExplicitSourcingEngine } from "./ExplicitSourcingEngine";
import { TriggerEventRelevanceEngine } from "./TriggerEventRelevanceEngine";
import { RelevantJobPostingEngine } from "./RelevantJobPostingEngine";
import { ContractRenewalTimingEngine } from "./ContractRenewalTimingEngine";

export class TimingScoreService {
  static readonly CURRENT_VERSION = 'v2.0-timing';

  /**
   * Calculates the Timing Score using the standardized Context.
   */
  static calculateTimingScore(context: OpportunityScoringContext): ScoreExplanation {
    const evidence: string[] = [];
    const factors: ScoreFactor[] = [];
    
    // In Phase 3B, timing signals are mapped directly from the opportunity timeline and requirements.
    // For this blueprint implementation, we stub the extractions from the Opportunity/Account object.
    
    // Extract Explicit Sourcing
    let rfpPresent = false;
    let rfqPresent = false;
    let tenderPresent = false;
    
    if (context.opportunity?.project_type === 'Tender') {
      tenderPresent = true;
    }

    // Extract Triggers (Placeholder mappings)
    const fundingEvents: any[] = [];
    const expansionEvents: any[] = [];
    const facilityOpenings: any[] = [];
    const permitActivity: any[] = [];
    const jobPostings: any[] = [];
    const contractRenewals: any[] = [];

    // Run Sub-Engines
    const sourcingScore = ExplicitSourcingEngine.evaluate(rfpPresent, rfqPresent, tenderPresent);
    const triggerScore = TriggerEventRelevanceEngine.evaluate(fundingEvents, expansionEvents, facilityOpenings, permitActivity);
    const hiringScore = RelevantJobPostingEngine.evaluate(jobPostings);
    const contractScore = ContractRenewalTimingEngine.evaluate(contractRenewals);

    // Calculate Final Timing (Max 25)
    const timingRaw = Math.min(25, sourcingScore + triggerScore + hiringScore + contractScore);

    // Evaluate factors and evidence
    let totalSignalsFound = 0;

    if (sourcingScore > 0) {
      factors.push({ name: "Explicit Sourcing", value: sourcingScore, max: 15 });
      evidence.push(`Found active tender or RFP process scoring ${sourcingScore} points.`);
      totalSignalsFound++;
    }

    if (triggerScore > 0) {
      factors.push({ name: "Trigger Events", value: triggerScore, max: 10 });
      evidence.push(`Found recent trigger events scoring ${triggerScore} points.`);
      totalSignalsFound++;
    }

    if (hiringScore > 0) {
      factors.push({ name: "Relevant Job Postings", value: hiringScore, max: 5 });
      evidence.push(`Detected hiring signals scoring ${hiringScore} points.`);
      totalSignalsFound++;
    }

    if (contractScore > 0) {
      factors.push({ name: "Contract Renewals", value: contractScore, max: 10 });
      evidence.push(`Found expiring contract scoring ${contractScore} points.`);
      totalSignalsFound++;
    }

    // Determine Confidence
    let confidence: ScoreConfidence = "High Confidence";
    
    if (!context.opportunity) {
      confidence = "Insufficient Data";
      evidence.push("Missing Opportunity mapping. Cannot determine timing.");
    } else if (totalSignalsFound === 0) {
      evidence.push("No temporal or urgency signals found.");
      confidence = "High Confidence"; // We are confident it's a 0
    }

    if (confidence === "Insufficient Data") {
      evidence.push("Degrading score due to lack of Opportunity context.");
    }

    return ScoreExplanationService.buildExplanation(
      timingRaw,
      factors,
      [],
      evidence,
      confidence
    );
  }
}
