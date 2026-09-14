import { OpportunityScoringContext } from "../OpportunityScoringContext";
import { ScoreExplanationService, ScoreExplanation, ScoreFactor, ScoreConfidence } from "../ScoreExplanationService";
import { StakeholderCountEngine } from "./StakeholderCountEngine";
import { StakeholderSeniorityEngine } from "./StakeholderSeniorityEngine";

export class EngagementScoreService {
  static readonly CURRENT_VERSION = 'v2.0-engagement';

  /**
   * Calculates the Engagement Score using the standardized Context.
   */
  static calculateEngagementScore(context: OpportunityScoringContext): ScoreExplanation {
    const evidence: string[] = [];
    const factors: ScoreFactor[] = [];
    
    // In Phase 3B, engagement signals are mapped directly from the opportunity timeline and stakeholders.
    
    // Extract Stakeholders
    const distinctEngagedContacts = context.stakeholders ? context.stakeholders.length : 0;
    const contactSeniority = context.stakeholders ? context.stakeholders.map(s => s.role) : []; // simplistic mapping

    // Count activities
    const totalActivities = context.activities ? context.activities.length : 0;
    const totalTasks = context.tasks ? context.tasks.length : 0;

    // Run Sub-Engines
    const countScore = StakeholderCountEngine.evaluate(distinctEngagedContacts);
    const seniorityScore = StakeholderSeniorityEngine.evaluate(contactSeniority);

    // Simplistic volume score based on raw CRM data
    let volumeScore = 0;
    if (totalActivities > 0 || totalTasks > 0) {
       volumeScore = Math.min(10, (totalActivities * 0.5) + (totalTasks * 0.2));
    }

    // Calculate Final Engagement (Max 20)
    const engagementRaw = Math.min(20, countScore + seniorityScore + volumeScore);

    // Evaluate factors and evidence
    let totalSignalsFound = 0;

    if (countScore > 0) {
      factors.push({ name: "Stakeholder Count", value: countScore, max: 5 });
      evidence.push(`Found ${distinctEngagedContacts} engaged stakeholders scoring ${countScore} points.`);
      totalSignalsFound++;
    }

    if (seniorityScore > 0) {
      factors.push({ name: "Stakeholder Seniority", value: seniorityScore, max: 5 });
      evidence.push(`Evaluated stakeholder seniority scoring ${seniorityScore} points.`);
      totalSignalsFound++;
    }

    if (volumeScore > 0) {
      factors.push({ name: "Activity Volume", value: volumeScore, max: 10 });
      evidence.push(`Found ${totalActivities} activities and ${totalTasks} tasks scoring ${volumeScore} points.`);
      totalSignalsFound++;
    }

    // Determine Confidence
    let confidence: ScoreConfidence = "High Confidence";
    
    if (!context.opportunity) {
      confidence = "Insufficient Data";
      evidence.push("Missing Opportunity mapping. Cannot determine engagement.");
    } else if (totalSignalsFound === 0) {
      evidence.push("No stakeholders, activities, or tasks found for this opportunity.");
      confidence = "High Confidence"; // Confident the engagement is 0
    }

    if (confidence === "Insufficient Data") {
      evidence.push("Degrading score due to lack of Opportunity context.");
    }

    return ScoreExplanationService.buildExplanation(
      engagementRaw,
      factors,
      [],
      evidence,
      confidence
    );
  }
}
