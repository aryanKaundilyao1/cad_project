import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== STEP 6: MASS GENERATION DRY RUN ===");
  
  let totalOpps = 0;
  let expectedSignals = 0;
  
  let page = 0;
  while(true) {
    const { data: opps } = await supabase.from('opportunities').select('id, accounts(industry, website)').range(page*1000, (page+1)*1000-1);
    if (!opps || opps.length === 0) break;
    
    for (const opp of opps) {
      totalOpps++;
      expectedSignals++; // High Growth is always generated
      
      if (opp.accounts && opp.accounts.industry) {
        expectedSignals++; // Category Match
      }
      
      if (opp.accounts && opp.accounts.website && opp.accounts.website.trim() !== '') {
        expectedSignals++; // Web Presence
      }
    }
    page++;
  }
  
  console.log(`Total Opportunities Processed: ${totalOpps}`);
  console.log(`Expected signal_instances: ${expectedSignals}`);
  console.log(`Expected opportunity_signals: ${expectedSignals}`);
  console.log(`Average signals per opportunity: ${(expectedSignals / totalOpps).toFixed(2)}`);
}

run().catch(console.error);
