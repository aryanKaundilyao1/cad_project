const { RecommendationGenerationService } = require('./src/services/intelligence/decision/RecommendationGenerationService');

async function runTests() {
    console.log("--- Phase 6B: Next Best Action & Urgency Engine Tests ---");

    try {
        console.log("[1] Simulating 'Tender Released' Scenario with High Confidence...");
        
        // Context: Company has a Tender Released signal, High timing score, High confidence.
        const input1 = {
            companyId: "00000000-0000-0000-0000-000000000000", // Will fail DB insert without a real ID, so we mock the logic manually here or just pass a known ID if we had one.
            signals: [{ name: 'Tender Released' }],
            opportunityScore: 88,
            purchaseProbability: 82,
            confidence: 95, // >= 90 gets 1.2x multiplier
            timingScore: 85,
            intentScore: 70,
            signalRecencyDays: 2,
            triggerMultiplier: 20
        };

        console.log("    Inputs:");
        console.log(`      Confidence: ${input1.confidence} (Multiplier should be 1.20)`);
        console.log(`      Timing Score: ${input1.timingScore}`);
        console.log(`      Signal Recency: ${input1.signalRecencyDays} days`);

        // We can't easily execute the DB-dependent GenerationService in this simple node script without a real companyId,
        // so we'll test the pure functions directly.
        const { NextBestActionEngine } = require('./src/services/intelligence/decision/NextBestActionEngine');
        const { UrgencyEngine } = require('./src/services/intelligence/decision/UrgencyEngine');

        const urgencyResult = UrgencyEngine.calculateUrgency({
            timingScore: input1.timingScore,
            signalRecencyDays: input1.signalRecencyDays,
            triggerMultiplier: input1.triggerMultiplier
        });
        
        console.log("\n    Urgency Engine Output:");
        console.log(`      Score: ${urgencyResult.urgencyScore.toFixed(2)}`);
        console.log(`      Level: ${urgencyResult.urgencyLevel}`);
        console.log(`      Window: ${urgencyResult.bestContactWindow}`);
        if (urgencyResult.urgencyLevel === 'Critical') console.log("      -> PASSED: Expected Critical Urgency.");

        const actionResult = NextBestActionEngine.calculateNextBestAction({
            signals: input1.signals,
            confidence: input1.confidence,
            urgencyLevel: urgencyResult.urgencyLevel,
            intentScore: input1.intentScore
        }, input1.triggerMultiplier);

        console.log("\n    Next Best Action Engine Output:");
        console.log(`      Action: ${actionResult.recommendedAction}`);
        console.log(`      Reason Codes: ${actionResult.reasonCodes.join(', ')}`);
        if (actionResult.recommendedAction === 'Call') console.log("      -> PASSED: Expected Call Action.");


        console.log("\n[2] Simulating Low Confidence Scenario...");
        const input2 = {
            signals: [{ name: 'Tender Released' }],
            confidence: 45, // < 50 forces Research
            urgencyLevel: 'Critical',
            intentScore: 70
        };

        const actionResult2 = NextBestActionEngine.calculateNextBestAction(input2, 20);
        console.log(`      Confidence: ${input2.confidence}`);
        console.log(`      Action: ${actionResult2.recommendedAction}`);
        console.log(`      Reason Codes: ${actionResult2.reasonCodes.join(', ')}`);
        if (actionResult2.recommendedAction === 'Research Account') console.log("      -> PASSED: Low Confidence safely forced Research Account.");

        console.log("\n--- Phase 6B Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

if (require.main === module) {
    runTests().then(() => process.exit(0));
}
