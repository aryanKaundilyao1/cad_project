const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- Phase 5A: Outcome Tracking Tests ---');

  if (!supabaseKey) {
      console.log('Skipping API tests due to missing Supabase Key. Ensure .env.local is populated.');
      return;
  }

  // Generate a mock opportunity UUID
  const mockOppId = '11111111-2222-3333-4444-555555555555';
  
  console.log('\n[1] Testing crm_outcomes table existence...');
  const { data: out, error: outErr } = await supabase.from('crm_outcomes').select('id').limit(1);
  if (outErr) console.error(' - Error:', outErr.message);
  else console.log(' - Passed');

  console.log('\n[2] Testing score_snapshot_archive table existence...');
  const { data: snap, error: snapErr } = await supabase.from('score_snapshot_archive').select('id').limit(1);
  if (snapErr) console.error(' - Error:', snapErr.message);
  else console.log(' - Passed');

  console.log('\n[3] Testing outcome_history table existence...');
  const { data: hist, error: histErr } = await supabase.from('outcome_history').select('id').limit(1);
  if (histErr) console.error(' - Error:', histErr.message);
  else console.log(' - Passed');

  console.log('\n--- Phase 5A Tests Complete ---');
}

runTests();
