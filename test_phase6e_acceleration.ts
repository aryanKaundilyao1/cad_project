import { StallDetectionEngine } from './src/services/intelligence/decision/acceleration/StallDetectionEngine';
import { DealHealthEngine } from './src/services/intelligence/decision/acceleration/DealHealthEngine';
import { DealRiskEngine } from './src/services/intelligence/decision/acceleration/DealRiskEngine';
import { FollowUpEngine } from './src/services/intelligence/decision/acceleration/FollowUpEngine';
import { InterventionRecommendationEngine } from './src/services/intelligence/decision/acceleration/InterventionRecommendationEngine';
import { DealExplainabilityEngine } from './src/services/intelligence/decision/acceleration/DealExplainabilityEngine';

async function runTests() {
    console.log("--- Phase 6E: Deal Acceleration & Follow-Up Tests ---");

    try {
        console.log("\n[1] Testing Stall Detection...");
        // If expected is 30 days and we've been there 40 days
        const stallResult = StallDetectionEngine.detectStall(40, 30);
        console.log(`    Days: 40/30 -> Stall Risk: ${stallResult.stallRisk}%, Status: ${stallResult.status}`);
        if (stallResult.isStalled) console.log("    -> PASSED: Correctly identified as Stalled");

        console.log("\n[2] Testing Deal Health Engine...");
        const healthResult = DealHealthEngine.calculateHealth({
            probabilityScore: 40,
            engagementScore: 30,
            activityScore: 50,
            stageProgressScore: 60
        });
        console.log(`    Calculated Health Score: ${healthResult.healthScore}, Status: ${healthResult.status}`);
        if (healthResult.status === 'At Risk') console.log("    -> PASSED: Correctly calculated 'At Risk' status");

        console.log("\n[3] Testing Risk Engine...");
        const signals = [
            { signalName: 'Competitor Mentioned', weight: 0.8 },
            { signalName: 'Budget cut rumors', weight: 0.9 }
        ];
        const risks = DealRiskEngine.evaluateRisks(signals, 20); // Low engagement
        console.log(`    Detected Risks: ${risks.map(r => r.riskType).join(', ')}`);
        if (risks.length === 3) console.log("    -> PASSED: Correctly identified 3 distinct risks");

        console.log("\n[4] Testing Follow-Up Engine...");
        const followUp = FollowUpEngine.recommendFollowUp(90, 'MEETING');
        console.log(`    Action: ${followUp.recommendedAction}, Wait: ${followUp.daysToWait} days`);
        if (followUp.recommendedAction === 'Meeting Request' && followUp.daysToWait < 3) {
            console.log("    -> PASSED: Accelerated follow-up for highly engaged meeting.");
        }

        console.log("\n[5] Testing Intervention Engine...");
        const interventions = InterventionRecommendationEngine.recommendInterventions(risks, stallResult, 15);
        console.log(`    Recommended Interventions: ${interventions.map(i => i.interventionType).join(', ')}`);
        if (interventions.some(i => i.interventionType === 'Competitive Differentiation Campaign')) {
            console.log("    -> PASSED: Triggered competitor intervention");
        }

        console.log("\n[6] Testing Explainability Engine...");
        const healthTrace = DealExplainabilityEngine.explainDealHealth(healthResult, 22, 20);
        console.log("\n    Health Trace:\n    " + healthTrace.replace(/\n/g, '\n    '));
        
        const interventionTrace = DealExplainabilityEngine.explainIntervention(interventions[0]);
        console.log("\n    Intervention Trace:\n    " + interventionTrace.replace(/\n/g, '\n    '));

        console.log("\n--- Phase 6E Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests().then(() => process.exit(0));
