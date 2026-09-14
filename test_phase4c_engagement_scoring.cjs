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
  console.log("Starting Phase 4C Engagement Scoring Test...");

  try {
    const { data: company } = await supabase.from('companies').select('id, name').eq('name', 'ABC Warehousing Pvt Ltd').single();
    if (!company) throw new Error("Company ABC Warehousing not found. Run previous tests first.");
    
    // Seed CRM/Engagement Signals
    const events = [
      { company_id: company.id, signal_type: 'crm_interaction', event_payload: { contact_role: 'Operations Director' } },
      { company_id: company.id, signal_type: 'meeting', event_payload: { contact_role: 'Procurement Head' } },
      { company_id: company.id, signal_type: 'email_response', event_payload: { contact_role: 'Operations Director' } }, // duplicate role to test distinct
      { company_id: company.id, signal_type: 'meeting', event_payload: { contact_role: 'CEO' } }
    ];

    const { error } = await supabase.from('signal_events').insert(events);
    if (error) throw error;
    
    console.log("✓ Seeded Engagement Signal Events for", company.name);
    console.log("To view the score, visit /admin/scoring/engagement and hit 'Rebuild Score'");

  } catch (err) {
    console.error("❌ Test setup failed:", err);
  }
}

runTest();
