const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_ANON_KEY || 'eyJh...');
async function run() {
  const { data, error } = await supabase.from('leads').select('id, company_name').limit(2);
  console.log("LEADS:", data);
  if(data && data.length > 0) {
     const testInsert = [{
          workspace_id: '123e4567-e89b-12d3-a456-426614174000', // Dummy UUID
          owner_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Opp',
          industry: 'Tech',
          legacy_lead_id: data[0].id,
          source: 'Manual',
          stage: 'Discovery',
          confidence: 'Medium'
     }];
     const { data: opps, error: oppErr } = await supabase.from('opportunities').insert(testInsert).select();
     console.log("INSERTED OPPS:", opps);
     console.log("ERROR:", oppErr);
  }
}
run();
