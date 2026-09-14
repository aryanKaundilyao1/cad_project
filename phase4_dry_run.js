import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== PHASE 4 DRY RUN ===");

  // Fetch real accounts
  const { data: opps } = await supabase.from('opportunities').select('account_id, accounts(industry, website)').not('account_id', 'is', null);
  
  // We need to estimate how many opportunities will be created from the signals.
  // In Phase 2/3, we determined that there are 3 main signals:
  // 1. High Growth Indicators (generated for ALL)
  // 2. Target Category Match (generated if industry != null)
  // 3. Verified Web Presence (generated if website != null)
  
  // Simulated Opportunity Types:
  // - Procurement Opportunity (Triggered by: Target Category Match)
  // - Expansion Opportunity (Triggered by: High Growth Indicators)
  // - Vendor Registration Opportunity (Triggered by: Verified Web Presence)
  
  let expectedOpps = 0;
  let types = {
    'Procurement Opportunity': 0,
    'Expansion Opportunity': 0,
    'Vendor Registration Opportunity': 0
  };
  
  // For Deduplication: Since we only create 1 of each type per account
  // Number of opps per account = Number of triggered types allowed by industry
  
  for (const opp of opps) {
    const acc = opp.accounts;
    if (!acc) continue;
    
    // High Growth always generates Expansion Opportunity
    expectedOpps++;
    types['Expansion Opportunity']++;
    
    // Category Match generates Procurement Opportunity (if industry is present)
    if (acc.industry) {
      expectedOpps++;
      types['Procurement Opportunity']++;
    }
    
    // Web Presence generates Vendor Registration Opportunity (if website is present)
    if (acc.website && acc.website.trim() !== '') {
      expectedOpps++;
      types['Vendor Registration Opportunity']++;
    }
  }

  console.log(`Expected New/Updated Opportunities: ${expectedOpps}`);
  console.log("Expected Distribution:");
  for (const t in types) {
    console.log(`  - ${t}: ${types[t]}`);
  }
}

run().catch(console.error);
