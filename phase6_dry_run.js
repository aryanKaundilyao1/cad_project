import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== PHASE 6 DRY RUN ===");

  // Weights (Simulated from Contactability Rules Table)
  const weights = {
    w1: 0.30, // Decision Maker
    w2: 0.20, // Phone Verified
    w3: 0.20, // Email Verified
    w4: 0.10, // LinkedIn
    w5: 0.10, // Website Contact Form
    w6: 0.10  // Prior Engagement
  };
  
  let totalOpps = 0;
  const scores = [];
  
  // 1. Fetch real opportunities and their linked accounts
  const { data: opps } = await supabase.from('opportunities').select('id, account_id, accounts(phone, email, linkedin_url, website)');
  
  // We will simulate the verification framework locally to create variance
  // Normally, this comes from accounts.phone_verification_state etc.
  for (const opp of opps) {
    if (!opp.accounts) continue;
    totalOpps++;
    
    const acc = opp.accounts;
    
    // 1. Decision Maker (Mock random distribution based on industry length)
    const indHash = acc.industry ? acc.industry.length : 1;
    const decisionMakerScore = (Math.random() > 0.6) ? 100 : 0; // 40% chance of decision maker
    
    // 2. Phone Available and Verified
    let phoneScore = 0;
    if (acc.phone) {
        // Randomly simulate verification
        const isVerified = Math.random() > 0.5;
        phoneScore = isVerified ? 100 : 50;
    }
    
    // 3. Email Available and Verified
    let emailScore = 0;
    if (acc.email) {
        const isVerified = Math.random() > 0.4;
        emailScore = isVerified ? 100 : 50;
    }
    
    // 4. LinkedIn Available
    let linkedinScore = acc.linkedin_url ? 100 : 0;
    
    // 5. Website Available
    let websiteScore = acc.website ? 100 : 0;
    
    // 6. CRM Engagement (Prior Engagement Score)
    // Random activity points between 0 and 100
    const priorEngagementScore = Math.floor(Math.random() * 80); // max 80 so it requires hard engagement to hit 100
    
    // Calculate Formula
    let contactScore = 
      (weights.w1 * decisionMakerScore) +
      (weights.w2 * phoneScore) +
      (weights.w3 * emailScore) +
      (weights.w4 * linkedinScore) +
      (weights.w5 * websiteScore) +
      (weights.w6 * priorEngagementScore);
      
    // Clamp
    contactScore = Math.max(0, Math.min(100, contactScore));
    scores.push(contactScore);
  }
  
  scores.sort((a,b) => a - b);
  
  if (scores.length > 0) {
      const min = scores[0].toFixed(2);
      const max = scores[scores.length - 1].toFixed(2);
      const avg = (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(2);
      
      const p10 = scores[Math.floor(scores.length * 0.10)].toFixed(2);
      const p25 = scores[Math.floor(scores.length * 0.25)].toFixed(2);
      const p50 = scores[Math.floor(scores.length * 0.50)].toFixed(2);
      const p75 = scores[Math.floor(scores.length * 0.75)].toFixed(2);
      const p90 = scores[Math.floor(scores.length * 0.90)].toFixed(2);
      
      console.log(`Distribution over ${totalOpps} records:`);
      console.log(`Min: ${min}`);
      console.log(`Max: ${max}`);
      console.log(`Avg: ${avg}`);
      console.log(`P10: ${p10}`);
      console.log(`P25: ${p25}`);
      console.log(`P50: ${p50}`);
      console.log(`P75: ${p75}`);
      console.log(`P90: ${p90}`);
  } else {
      console.log("No valid opportunities found.");
  }
}

run().catch(console.error);
