const { PlattScalingService } = require('./src/services/intelligence/calibration/PlattScalingService');
const { CalibrationEvaluationService } = require('./src/services/intelligence/calibration/CalibrationEvaluationService');

function runTests() {
    console.log("--- Phase 5D: Probability Calibration Tests ---");

    // Simulated dataset of 10 opportunities
    // An uncalibrated model predicting ~80% but actually winning 50% of the time.
    const uncalibratedPredictions = [
        { predicted: 0.85, actual: 1 },
        { predicted: 0.80, actual: 1 },
        { predicted: 0.82, actual: 1 },
        { predicted: 0.78, actual: 1 },
        { predicted: 0.81, actual: 1 },
        { predicted: 0.79, actual: 0 },
        { predicted: 0.83, actual: 0 },
        { predicted: 0.86, actual: 0 },
        { predicted: 0.77, actual: 0 },
        { predicted: 0.84, actual: 0 }
    ];

    const uncalibratedBrier = CalibrationEvaluationService.calculateBrierScore(uncalibratedPredictions);
    console.log(`[1] Uncalibrated Brier Score: ${uncalibratedBrier.toFixed(4)} (Expected ~0.10)`);

    // Let's calibrate it using Platt Scaling 
    // We apply an arbitrary A and B to shift the predictions closer to the true mean (0.50)
    // A = 2, B = -1.6 shifts 0.8 down to ~0.50
    const A = 2;
    const B = -1.6;
    
    const calibratedPredictions = uncalibratedPredictions.map(p => ({
        predicted: PlattScalingService.calculateCalibratedProbability(p.predicted, A, B),
        actual: p.actual
    }));

    console.log(`[2] Example Calibrated Probability (Raw 0.80) -> ${calibratedPredictions[1].predicted.toFixed(2)}`);

    const calibratedBrier = CalibrationEvaluationService.calculateBrierScore(calibratedPredictions);
    console.log(`[3] Calibrated Brier Score: ${calibratedBrier.toFixed(4)}`);

    if (calibratedBrier < uncalibratedBrier) {
        console.log("  -> PASSED: Calibration improved the Brier Score (lower error).");
    } else {
        console.error("  -> FAILED: Calibration made the Brier Score worse.");
    }

    const logLoss = CalibrationEvaluationService.calculateLogLoss(calibratedPredictions);
    console.log(`[4] Calibrated Log Loss: ${logLoss.toFixed(4)}`);
    if (isFinite(logLoss)) console.log("  -> PASSED: Log Loss is finite.");

    console.log("--- Phase 5D Tests Complete ---");
}

runTests();
