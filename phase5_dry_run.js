import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== PHASE 5 DRY RUN ===");

  // In this phase, we are simulating the calculation of Procurement Probability 
  // for all 1004 opportunities.
  
  // Weights (Simulated from Procurement Rules Table)
  // Total weights should sum to 1.0 (or 100%)
  const weights = {
    w1: 0.30, // Signal Strength (highly dependent on current signals)
    w2: 0.15, // Project Stage
    w3: 0.15, // Tender Stage
    w4: 0.10, // Vendor Registration
    w5: 0.10, // Budget Availability
    w6: 0.10, // Decision Maker Presence
    w7: 0.10  // Historical Category Conversion Rate
  };
  
  let totalOpps = 0;
  const probabilities = [];
  
  // 1. Fetch real accounts to base our simulation on
  const { data: opps } = await supabase.from('opportunities').select('id, account_id, created_at, accounts(industry, website)');
  
  for (const opp of opps) {
    if (!opp.accounts) continue;
    totalOpps++;
    
    // Simulate component scores (0-100)
    // Signal Strength Score: Base 40 + random variance, decayed by recency (let's say 1 month old = ~0.8 multiplier)
    const recencyMultiplier = 0.8;
    const signalStrengthScore = Math.floor((40 + Math.random() * 40) * recencyMultiplier);
    
    // Project Stage: Higher if industry exists
    const projectStageScore = opp.accounts.industry ? 70 : 20;
    
    // Tender Stage: Higher if industry exists and has website
    const tenderStageScore = (opp.accounts.industry && opp.accounts.website) ? 60 : 10;
    
    // Vendor Registration: High if website exists
    const vendorRegistrationScore = opp.accounts.website ? 85 : 0;
    
    // Budget & Decision Maker (Simulated as random but deterministic for this dry run)
    const budgetAvailabilityScore = 50 + Math.floor(Math.random() * 30);
    const decisionMakerScore = 40 + Math.floor(Math.random() * 40);
    
    // Historical Category Conversion (Based on industry length as a stable hash)
    const indLength = opp.accounts.industry ? opp.accounts.industry.length : 0;
    const historicalScore = 30 + (indLength * 2);
    
    // Calculate exact formula
    let prob = 
      (weights.w1 * signalStrengthScore) +
      (weights.w2 * projectStageScore) +
      (weights.w3 * tenderStageScore) +
      (weights.w4 * vendorRegistrationScore) +
      (weights.w5 * budgetAvailabilityScore) +
      (weights.w6 * decisionMakerScore) +
      (weights.w7 * historicalScore);
      
    // Clamp
    prob = Math.max(0, Math.min(100, prob));
    probabilities.push(prob);
  }
  
  probabilities.sort((a,b) => a - b);
  
  const min = probabilities[0].toFixed(2);
  const max = probabilities[probabilities.length - 1].toFixed(2);
  const avg = (probabilities.reduce((a,b)=>a+b,0) / probabilities.length).toFixed(2);
  
  const p10 = probabilities[Math.floor(probabilities.length * 0.10)].toFixed(2);
  const p25 = probabilities[Math.floor(probabilities.length * 0.25)].toFixed(2);
  const p50 = probabilities[Math.floor(probabilities.length * 0.50)].toFixed(2);
  const p75 = probabilities[Math.floor(probabilities.length * 0.75)].toFixed(2);
  const p90 = probabilities[Math.floor(probabilities.length * 0.90)].toFixed(2);
  
  console.log(`Distribution over ${totalOpps} records:`);
  console.log(`Min: ${min}`);
  console.log(`Max: ${max}`);
  console.log(`Avg: ${avg}`);
  console.log(`P10: ${p10}`);
  console.log(`P25: ${p25}`);
  console.log(`P50: ${p50}`);
  console.log(`P75: ${p75}`);
  console.log(`P90: ${p90}`);
}

run().catch(console.error);
