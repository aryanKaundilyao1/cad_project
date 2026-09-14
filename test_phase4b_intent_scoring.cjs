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
  console.log("Starting Phase 4B Intent Scoring Test...");

  try {
    // We assume the company 'ABC Warehousing Pvt Ltd' and product 'Alpha Warehouse Package' exist from Phase 4A test.
    const { data: company } = await supabase.from('companies').select('id, name').eq('name', 'ABC Warehousing Pvt Ltd').single();
    if (!company) throw new Error("Company ABC Warehousing not found. Run test_phase4a_fit_scoring.cjs first.");
    
    // Seed Intent Signals
    const events = [
      { company_id: company.id, signal_type: 'third_party_surge', event_payload: { topic: 'Warehouse Automation', score: 85 } },
      { company_id: company.id, signal_type: 'third_party_surge', event_payload: { topic: 'Forklift Telematics', score: 72 } },
      { company_id: company.id, signal_type: 'website_visit', event_payload: { url: '/pricing' } },
      { company_id: company.id, signal_type: 'demo_request', event_payload: {} },
      { company_id: company.id, signal_type: 'review_site_visit', event_payload: {} },
      { company_id: company.id, signal_type: 'competitor_comparison', event_payload: {} }
    ];

    const { error } = await supabase.from('signal_events').insert(events);
    if (error) throw error;
    
    console.log("✓ Seeded Intent Signal Events for", company.name);
    console.log("To view the score, visit /admin/scoring/intent and hit 'Rebuild Score'");

  } catch (err) {
    console.error("❌ Test setup failed:", err);
  }
}

runTest();
