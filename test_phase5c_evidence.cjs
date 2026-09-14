const { WeightOfEvidenceService } = require('./src/services/intelligence/evidence/WeightOfEvidenceService');
const { InformationValueService } = require('./src/services/intelligence/evidence/InformationValueService');

function runTests() {
    console.log("--- Phase 5C: Evidence Extraction Tests ---");

    const totalWon = 1000;
    const totalLost = 1000;

    // Test 1: Strong Positive Signal (Tender Released)
    const s1Won = 290;
    const s1Lost = 110;
    
    // WOE = ln( (290/1000) / (110/1000) ) = ln( 0.29 / 0.11 ) = ln(2.636) = 0.969
    const s1Woe = WeightOfEvidenceService.calculateWOE(s1Won, s1Lost, totalWon, totalLost);
    const s1Iv = InformationValueService.calculateIV(s1Won, s1Lost, totalWon, totalLost, s1Woe);
    
    console.log(`[1] Tender Released: WOE = ${s1Woe}, IV = ${s1Iv} (${InformationValueService.classifyIV(s1Iv)})`);
    if (s1Woe > 0.9 && s1Iv > 0.1) console.log("  -> PASSED"); else console.error("  -> FAILED");

    // Test 2: Strong Negative Signal (Budget Freeze)
    const s2Won = 50;
    const s2Lost = 250;
    
    // WOE = ln( (50/1000) / (250/1000) ) = ln( 0.05 / 0.25 ) = ln(0.2) = -1.609
    const s2Woe = WeightOfEvidenceService.calculateWOE(s2Won, s2Lost, totalWon, totalLost);
    const s2Iv = InformationValueService.calculateIV(s2Won, s2Lost, totalWon, totalLost, s2Woe);
    
    console.log(`[2] Budget Freeze: WOE = ${s2Woe}, IV = ${s2Iv} (${InformationValueService.classifyIV(s2Iv)})`);
    if (s2Woe < -1.5 && s2Iv > 0.3) console.log("  -> PASSED"); else console.error("  -> FAILED");

    // Test 3: Zero Occurrences (Laplace Smoothing Test)
    const s3Woe = WeightOfEvidenceService.calculateWOE(0, 100, totalWon, totalLost);
    console.log(`[3] Zero Occurrences (Laplace): WOE = ${s3Woe}`);
    if (isFinite(s3Woe)) console.log("  -> PASSED (No Infinity)"); else console.error("  -> FAILED");

    console.log("--- Phase 5C Tests Complete ---");
}

runTests();
