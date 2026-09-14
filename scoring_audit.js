import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== SCORING VALIDATION AUDIT ===");

  const { data: opps, error } = await supabase.from('opportunities').select('procurement_probability, contactability_score, order_probability, confidence');
  if (error) {
    console.error("Error fetching opportunities:", error.message);
    // Let's also fetch columns to see if they exist
    return;
  }
  
  if (!opps || opps.length === 0) {
    console.log("No opportunities found.");
    return;
  }

  let ppMin = 100, ppMax = 0, ppSum = 0, ppCount = 0;
  let csMin = 100, csMax = 0, csSum = 0, csCount = 0;
  let opMin = 100, opMax = 0, opSum = 0, opCount = 0;
  let confMin = 100, confMax = 0, confSum = 0, confCount = 0;
  
  const ppDist = {};
  const csDist = {};
  const opDist = {};
  const confDist = {};
  
  for (const opp of opps) {
    const pp = opp.procurement_probability !== undefined ? opp.procurement_probability : null;
    const cs = opp.contactability_score !== undefined ? opp.contactability_score : null;
    const op = opp.order_probability !== undefined ? opp.order_probability : null;
    const conf = opp.confidence !== undefined ? opp.confidence : null;

    if (pp !== null) {
      ppMin = Math.min(ppMin, pp); ppMax = Math.max(ppMax, pp); ppSum += pp; ppCount++;
      ppDist[pp] = (ppDist[pp] || 0) + 1;
    }
    if (cs !== null) {
      csMin = Math.min(csMin, cs); csMax = Math.max(csMax, cs); csSum += cs; csCount++;
      csDist[cs] = (csDist[cs] || 0) + 1;
    }
    if (op !== null) {
      opMin = Math.min(opMin, op); opMax = Math.max(opMax, op); opSum += op; opCount++;
      opDist[op] = (opDist[op] || 0) + 1;
    }
    if (conf !== null) {
      confMin = Math.min(confMin, conf); confMax = Math.max(confMax, conf); confSum += conf; confCount++;
      confDist[conf] = (confDist[conf] || 0) + 1;
    }
  }

  console.log("\n--- DISTRIBUTION ---");
  console.log(`Procurement Prob: MIN=${ppMin === 100 ? 'N/A' : ppMin}, MAX=${ppMax}, AVG=${ppCount ? (ppSum/ppCount).toFixed(2) : 'N/A'}`);
  console.log(`Contactability:   MIN=${csMin === 100 ? 'N/A' : csMin}, MAX=${csMax}, AVG=${csCount ? (csSum/csCount).toFixed(2) : 'N/A'}`);
  console.log(`Order Prob:       MIN=${opMin === 100 ? 'N/A' : opMin}, MAX=${opMax}, AVG=${opCount ? (opSum/opCount).toFixed(2) : 'N/A'}`);
  console.log(`Confidence:       MIN=${confMin === 100 ? 'N/A' : confMin}, MAX=${confMax}, AVG=${confCount ? (confSum/confCount).toFixed(2) : 'N/A'}`);

  console.log("\n--- UNIQUE VALUES ---");
  console.log("Procurement Probability:");
  for (const k in ppDist) console.log(`  ${k}% = ${ppDist[k]} rows`);
  
  console.log("Contactability Score:");
  for (const k in csDist) console.log(`  ${k}% = ${csDist[k]} rows`);
  
  console.log("Order Probability:");
  for (const k in opDist) console.log(`  ${k}% = ${opDist[k]} rows`);
  
  console.log("Confidence:");
  for (const k in confDist) console.log(`  ${k}% = ${confDist[k]} rows`);
  
}

run().catch(console.error);
