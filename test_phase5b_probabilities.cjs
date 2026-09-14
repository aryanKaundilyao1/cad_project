const { ColdStartProbabilityService } = require('./src/services/intelligence/probability/ColdStartProbabilityService');
const { ProbabilityWindowService } = require('./src/services/intelligence/probability/ProbabilityWindowService');

function runTests() {
  console.log('--- Phase 5B: Probability Engine Tests ---');

  // Test 1: Linear Interpolation for Score = 84
  // Band: 75 to 89 maps to 45% to 65%
  // Calculation: 45 + (84-75)/(89-75) * (65-45) = 45 + 9/14 * 20 = 45 + 12.85 = 57.85% (rounded 57.86)
  const score = 84;
  const prob = ColdStartProbabilityService.calculateProbability(score);
  console.log(`[1] Interpolation Test (Score 84): Base Probability = ${prob}% (Expected ~57.86%)`);
  
  if (Math.abs(prob - 57.86) > 0.05) console.error('  -> FAILED');
  else console.log('  -> PASSED');

  // Test 2: Windows Engine
  // High Timing Score (>20) should recommend 30-day window
  const timingScore = 22;
  const windows = ProbabilityWindowService.calculateWindowDistribution(prob, timingScore);
  console.log(`\n[2] Window Test (Timing 22):`);
  console.log(`  - 30 Day: ${windows.prob30Day}%`);
  console.log(`  - 90 Day: ${windows.prob90Day}%`);
  console.log(`  - 180 Day: ${windows.prob180Day}%`);
  console.log(`  - Recommended: ${windows.recommendedWindow}`);
  
  if (windows.recommendedWindow === '30-day' && windows.prob180Day === prob) console.log('  -> PASSED');
  else console.error('  -> FAILED');

  console.log('\n--- Phase 5B Tests Complete ---');
}

runTests();
