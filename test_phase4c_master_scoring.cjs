require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("Starting Phase 4C Master Opportunity Scoring Test...");

  try {
    const { data: company } = await supabase.from('companies').select('id, name').eq('name', 'ABC Warehousing Pvt Ltd').single();
    if (!company) throw new Error("Company ABC Warehousing not found.");
    
    console.log(`✓ Master Score is ready to be rebuilt for ${company.name}`);
    console.log("Please visit /admin/scoring/opportunity in your browser, select the company/product, and click 'Rebuild Score'");
    console.log("The UI will trigger the Master Score Engine to synthesize the Fit, Intent, Timing, and Engagement pillars and apply vertical weights.");
    
  } catch (err) {
    console.error("❌ Test setup failed:", err);
  }
}

runTest();
