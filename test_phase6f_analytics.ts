import { RecommendationAdoptionEngine } from './src/services/intelligence/decision/analytics/RecommendationAdoptionEngine';
import { RecommendationPerformanceEngine } from './src/services/intelligence/decision/analytics/RecommendationPerformanceEngine';
import { PlaybookPerformanceEngine } from './src/services/intelligence/decision/analytics/PlaybookPerformanceEngine';
import { ActionCenterEngine } from './src/services/intelligence/decision/analytics/ActionCenterEngine';
import { DecisionExplainabilityEngine } from './src/services/intelligence/decision/analytics/DecisionExplainabilityEngine';

async function runTests() {
    console.log("--- Phase 6F: Decision Analytics & Action Center Tests ---");

    try {
        console.log("\n[1] Testing Recommendation Adoption Engine...");
        const adoption = RecommendationAdoptionEngine.calculateAdoption(100, 75, 25, 50);
        console.log(`    Adoption Rate: ${adoption.adoptionRate}% | Completion Rate: ${adoption.completionRate}% | Ignore Rate: ${adoption.ignoreRate}%`);
        if (adoption.adoptionRate === 75 && adoption.completionRate === 66.67) console.log("    -> PASSED: Correctly calculated adoption metrics");

        console.log("\n[2] Testing Recommendation Performance Engine...");
        const perf = RecommendationPerformanceEngine.calculatePerformance(15, 5, 1500000, 75);
        console.log(`    Win Rate: ${perf.winRate}% | Conversion Rate (from adopted): ${perf.conversionRate}% | Revenue: $${perf.revenueGenerated}`);
        if (perf.winRate === 75 && perf.conversionRate === 20) console.log("    -> PASSED: Correctly calculated performance metrics");

        console.log("\n[3] Testing Playbook Performance Engine...");
        const playbookPerf = PlaybookPerformanceEngine.evaluatePlaybook(10, 50, 450);
        console.log(`    Playbook Conversion: ${playbookPerf.conversionRate}% | Avg Sales Cycle: ${playbookPerf.averageSalesCycle} days`);
        if (playbookPerf.conversionRate === 20 && playbookPerf.averageSalesCycle === 45) console.log("    -> PASSED: Correctly calculated playbook effectiveness");

        console.log("\n[4] Testing Action Center Prioritization...");
        const tasks = [
            { id: 'task-1', urgencyScore: 90, probabilityScore: 80, dealValue: 500000, confidenceScore: 85 }, // Should be critical
            { id: 'task-2', urgencyScore: 20, probabilityScore: 40, dealValue: 100000, confidenceScore: 50 }  // Should be low
        ];
        const prioritized = ActionCenterEngine.prioritizeActions(tasks);
        console.log(`    Top Task: ${prioritized[0].id} (Priority: ${prioritized[0].priorityLevel}, Score: ${prioritized[0].priorityScore})`);
        console.log(`    Bottom Task: ${prioritized[1].id} (Priority: ${prioritized[1].priorityLevel}, Score: ${prioritized[1].priorityScore})`);
        if (prioritized[0].id === 'task-1' && prioritized[0].priorityLevel === 'Critical') console.log("    -> PASSED: Action prioritization correctly balanced urgency and deal value");

        console.log("\n[5] Testing Explainability Traces...");
        const traceData = {
            signalName: 'Tender Released',
            timingScore: 84,
            probabilityScore: 74,
            confidenceScore: 89,
            contactRole: 'Procurement Head',
            productName: 'PEB Warehouse Package',
            playbookName: 'Tender Response',
            action: 'Call'
        };
        const trace = DecisionExplainabilityEngine.generateFullTrace(traceData);
        console.log("\n    Trace Output:\n    " + trace.replace(/\n/g, '\n    '));

        console.log("\n--- Phase 6F Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests().then(() => process.exit(0));
