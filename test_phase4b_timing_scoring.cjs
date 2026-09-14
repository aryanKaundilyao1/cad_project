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
  console.log("Starting Phase 4B Timing Scoring Test...");

  try {
    const { data: company } = await supabase.from('companies').select('id, name').eq('name', 'ABC Warehousing Pvt Ltd').single();
    if (!company) throw new Error("Company ABC Warehousing not found. Run test_phase4a_fit_scoring.cjs first.");
    
    // Seed Timing Signals
    const events = [
      { company_id: company.id, signal_type: 'rfp_issued', event_payload: { description: 'Seeking WMS implementation' } },
      { company_id: company.id, signal_type: 'expansion_announced', event_payload: { details: 'Opening new 50,000 sq ft facility in Pune' } },
      { company_id: company.id, signal_type: 'job_posting', event_payload: { title: 'Procurement Manager' } },
      { company_id: company.id, signal_type: 'contract_renewal', event_payload: { vendor: 'Competitor X', renewal_date: new Date(Date.now() + 60*24*60*60*1000) } } // 60 days in future
    ];

    const { error } = await supabase.from('signal_events').insert(events);
    if (error) throw error;
    
    console.log("✓ Seeded Timing Signal Events for", company.name);
    console.log("To view the score, visit /admin/scoring/timing and hit 'Rebuild Score'");

  } catch (err) {
    console.error("❌ Test setup failed:", err);
  }
}

runTest();
