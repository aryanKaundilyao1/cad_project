require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPhase3A() {
  console.log("Starting Phase 3A Tests...");

  try {
    // 1. Create a Company
    console.log("1. Creating a test company...");
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({
        name: 'Acme Corp Test',
        domain: 'acme-test.com',
        industry: 'Manufacturing'
      })
      .select()
      .single();

    if (companyErr) throw companyErr;
    console.log("✅ Company created:", company.id);

    // 2. Create a Contact
    console.log("2. Creating a test contact...");
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .insert({
        company_id: company.id,
        name: 'John Doe',
        title: 'Procurement Manager',
        email: 'john@acme-test.com'
      })
      .select()
      .single();

    if (contactErr) throw contactErr;
    console.log("✅ Contact created:", contact.id);

    // 3. Create a Signal Definition
    console.log("3. Creating a test signal definition...");
    const { data: signalDef, error: signalDefErr } = await supabase
      .from('signal_definitions')
      .insert({
        name: 'Pricing Page Visit',
        category: 'Digital Research',
        weight_tier: 'Tier 2',
        base_weight: 8
      })
      .select()
      .single();

    if (signalDefErr) throw signalDefErr;
    console.log("✅ Signal Definition created:", signalDef.id);

    // 4. Create a Signal Event (Immutable)
    console.log("4. Recording a signal event...");
    const { data: event, error: eventErr } = await supabase
      .from('signal_event_store')
      .insert({
        company_id: company.id,
        signal_definition_id: signalDef.id,
        payload: { path: '/pricing', duration: '2m', user_agent: 'test' },
        raw_source: 'First-party Analytics'
      })
      .select()
      .single();

    if (eventErr) throw eventErr;
    console.log("✅ Signal Event recorded:", event.id);

    // 5. Query the Timeline
    console.log("5. Querying company timeline...");
    const { data: timeline, error: timelineErr } = await supabase
      .from('signal_event_store')
      .select('*, signal_definitions(*)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (timelineErr) throw timelineErr;
    console.log(`✅ Retrieved ${timeline.length} events for company timeline.`);
    if (timeline.length > 0) {
      console.log("Latest event definition:", timeline[0].signal_definitions.name);
    }

    console.log("\n🎉 All Phase 3A tests passed successfully!");
    
    // Clean up
    console.log("\nCleaning up test data...");
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('signal_definitions').delete().eq('id', signalDef.id);
    console.log("✅ Cleanup complete.");

  } catch (error) {
    console.error("❌ Test Failed:");
    console.error(error);
  }
}

testPhase3A();
