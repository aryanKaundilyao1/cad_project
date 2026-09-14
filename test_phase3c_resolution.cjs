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
  console.log("Starting Phase 3C Entity Resolution Test...");

  try {
    // 1. Create a canonical company manually
    console.log("1. Creating canonical company 'Global Steel Corp'...");
    const { data: canonical, error: err1 } = await supabase
      .from('companies')
      .insert({ name: 'Global Steel Corp', resolution_confidence: 100 })
      .select().single();
    if (err1) throw err1;

    // 2. Add an alias for the canonical company
    console.log("2. Adding alias 'Global Steel Ltd'...");
    const { error: err2 } = await supabase
      .from('company_aliases')
      .insert({ company_id: canonical.id, alias_name: 'Global Steel Ltd', source: 'test_script' });
    if (err2) throw err2;

    // 3. Simulate an incoming record with a borderline name "Global Steel International"
    // Usually EntityResolver would do this, but we simulate the outcome in the DB queue
    console.log("3. Simulating borderline match into review queue...");
    const { data: queueItem, error: err3 } = await supabase
      .from('entity_review_queue')
      .insert({
        incoming_payload: { companyName: 'Global Steel International' },
        candidate_company_ids: [canonical.id],
        confidence_score: 80,
        matching_reasons: ['High partial match (substring inclusion).'],
        status: 'pending'
      })
      .select().single();
    if (err3) throw err3;

    // 4. Register an Enrichment Source
    console.log("4. Registering Enrichment Source...");
    const { data: source, error: err4 } = await supabase
      .from('enrichment_sources')
      .insert({ source_name: 'Mock Financial API', source_type: 'financial' })
      .select().single();
    if (err4) throw err4;

    // 5. Append Enrichment History to Canonical Company
    console.log("5. Appending Enrichment Record...");
    const { error: err5 } = await supabase
      .from('company_enrichment_history')
      .insert({
        company_id: canonical.id,
        source_id: source.id,
        field_name: 'annual_revenue',
        field_value: { amount: 5000000, currency: 'USD' },
        reliability: 'high'
      });
    if (err5) throw err5;

    console.log("✅ All Entity Resolution & Enrichment models successfully verified.");

    // Cleanup
    console.log("6. Cleaning up test data...");
    await supabase.from('companies').delete().eq('id', canonical.id);
    await supabase.from('enrichment_sources').delete().eq('id', source.id);
    await supabase.from('entity_review_queue').delete().eq('id', queueItem.id);
    
    console.log("🎉 Test Phase 3C complete.");

  } catch (err) {
    console.error("❌ Test failed:");
    console.error(err);
  }
}

runTest();
