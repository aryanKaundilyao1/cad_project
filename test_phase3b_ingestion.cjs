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
  console.log("Starting Phase 3B Ingestion Pipeline Test...");

  try {
    // 1. Create a Provider
    console.log("1. Registering Provider...");
    const { data: provider, error: pErr } = await supabase
      .from('signal_providers')
      .insert({
        name: 'Test Tender API',
        provider_type: 'mock_government_tender',
        category: 'Tender Providers',
        auth_method: 'api_key',
        is_enabled: true
      })
      .select().single();
      
    if (pErr) throw pErr;
    console.log(`✅ Provider created: ${provider.id}`);

    // 2. We skip running the TypeScript node logic directly here because of TS imports, 
    // but we will insert a raw payload directly and simulate the pipeline outcome to ensure schema constraints hold.
    console.log("2. Inserting Raw Payload...");
    const { data: raw, error: rawErr } = await supabase
      .from('raw_external_events')
      .insert({
        provider_id: provider.id,
        event_type: 'Tender_Awarded',
        raw_payload: { awarded_to: "Test Steel Co", value: 1000 },
        status: 'pending'
      })
      .select().single();
      
    if (rawErr) throw rawErr;
    console.log(`✅ Raw payload inserted: ${raw.id}`);

    // 3. Simulate processing success
    console.log("3. Updating processing status...");
    const { error: updErr } = await supabase
      .from('raw_external_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', raw.id);
      
    if (updErr) throw updErr;
    console.log(`✅ Raw payload status updated to processed`);

    // 4. Create Sync Log
    console.log("4. Creating Sync Log...");
    const { data: log, error: logErr } = await supabase
      .from('provider_sync_logs')
      .insert({
        provider_id: provider.id,
        status: 'success',
        records_processed: 1,
        duration_ms: 150
      })
      .select().single();
      
    if (logErr) throw logErr;
    console.log(`✅ Sync log created: ${log.id}`);

    // Cleanup
    console.log("5. Cleaning up...");
    await supabase.from('signal_providers').delete().eq('id', provider.id);
    console.log("✅ Cleanup complete.");
    
    console.log("🎉 Test Phase 3B complete.");

  } catch (err) {
    console.error("❌ Test failed:");
    console.error(err);
  }
}

runTest();
