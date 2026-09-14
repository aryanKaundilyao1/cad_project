const { EnsembleProbabilityEngine } = require('./src/services/intelligence/predictive/EnsembleProbabilityEngine');
const { ProbabilityConfidenceEngine } = require('./src/services/intelligence/predictive/ProbabilityConfidenceEngine');
const { BayesianProbabilityEngine } = require('./src/services/intelligence/predictive/BayesianProbabilityEngine');

function runTests() {
    console.log("--- Phase 5E: Advanced Predictive Probability Engine Tests ---");

    // 1. Test Bayesian Engine
    console.log("[1] Testing Bayesian Engine...");
    const prior = 0.50; // 50% baseline
    const bayesFactors = [
        1.5, // Positive signal
        1.2, // Positive signal
        0.8  // Negative signal
    ];
    
    // Posterior Odds = (0.5/0.5) * 1.5 * 1.2 * 0.8 = 1.44
    // Probability = 1.44 / (1 + 1.44) = 0.5901...
    const bayesianProb = BayesianProbabilityEngine.calculateProbability(prior, bayesFactors);
    console.log(`    Prior: ${prior}, BFs: [1.5, 1.2, 0.8] -> Bayesian Output: ${bayesianProb.toFixed(4)} (Expected ~0.59)`);
    
    // 2. Test Ensemble Blending
    console.log("\n[2] Testing Ensemble Blending...");
    const logisticProb = 0.65;
    const gbmProb = 0.68;
    
    const finalProb = EnsembleProbabilityEngine.blendProbabilities(bayesianProb, logisticProb, gbmProb, {
        bayesian: 0.33,
        logistic: 0.33,
        gbm: 0.34
    });
    
    console.log(`    Bayesian: ${bayesianProb.toFixed(4)}`);
    console.log(`    Logistic: ${logisticProb.toFixed(4)}`);
    console.log(`    GBM:      ${gbmProb.toFixed(4)}`);
    console.log(`    Final Ensemble Probability: ${finalProb.toFixed(4)}`);

    // 3. Test Confidence Engine (High Agreement)
    console.log("\n[3] Testing Confidence Engine (High Agreement)...");
    const highConfidence = ProbabilityConfidenceEngine.calculateConfidence(0.70, 0.72, 0.71, 10);
    console.log(`    Scores [0.70, 0.72, 0.71], Signals: 10 -> Confidence: ${highConfidence.score}% ${highConfidence.interval}`);
    if (highConfidence.score > 90) console.log("    -> PASSED: High agreement yielded high confidence.");

    // 4. Test Confidence Engine (Low Agreement)
    console.log("\n[4] Testing Confidence Engine (Low Agreement/High Variance)...");
    const lowConfidence = ProbabilityConfidenceEngine.calculateConfidence(0.30, 0.90, 0.60, 2);
    console.log(`    Scores [0.30, 0.90, 0.60], Signals: 2 -> Confidence: ${lowConfidence.score}% ${lowConfidence.interval}`);
    if (lowConfidence.score < 50) console.log("    -> PASSED: Low agreement yielded low confidence.");

    console.log("\n--- Phase 5E Tests Complete ---");
}

runTests();
