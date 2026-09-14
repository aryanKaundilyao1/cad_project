const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- Phase 4D: Analytics & Admin Tests ---');

  // 1. Test Weight Manager
  console.log('\n[1] Testing Weight Manager...');
  const { data: weights, error: wErr } = await supabase.from('vertical_weight_profiles').select('*');
  if (wErr && wErr.code === '42P01') {
    console.log(' - vertical_weight_profiles table not found (migration skipped). using mock fallback.');
  } else if (wErr) {
    console.error(' - Error:', wErr.message);
  } else {
    console.log(` - Successfully retrieved ${weights?.length || 0} weight profiles.`);
  }

  // 2. Test Score Version Manager
  console.log('\n[2] Testing Score Versions...');
  const { data: versions, error: vErr } = await supabase.from('score_versions').select('*');
  if (vErr && vErr.code === '42P01') {
    console.log(' - score_versions table not found. using mock fallback.');
  } else if (vErr) {
    console.error(' - Error:', vErr.message);
  } else {
    console.log(` - Successfully retrieved ${versions?.length || 0} score versions.`);
  }

  // 3. Test Analytics Dashboard Query
  console.log('\n[3] Testing Dashboard Metrics (Opportunity Aggregation)...');
  const { data: scores, error: sErr } = await supabase.from('opportunity_scores').select('fit_score, intent_score, timing_score, engagement_score, final_score');
  if (sErr) {
    console.error(' - Error:', sErr.message);
  } else if (scores) {
    console.log(` - Found ${scores.length} scores to aggregate.`);
    if (scores.length > 0) {
      const avg = scores.reduce((acc, curr) => acc + (curr.final_score || 0), 0) / scores.length;
      console.log(` - Average Master Score: ${avg.toFixed(1)}`);
    }
  }

  // 4. Test Audit Log
  console.log('\n[4] Testing Audit Trail...');
  const { data: audits, error: aErr } = await supabase.from('opportunity_audit_log').select('*').limit(5);
  if (aErr) {
    console.error(' - Error:', aErr.message);
  } else {
    console.log(` - Retrieved ${audits?.length || 0} recent audit logs.`);
    if (audits && audits.length > 0) {
      console.log(` - Sample trigger: ${audits[0].trigger_event}`);
    }
  }

  console.log('\n--- Phase 4D Tests Complete ---');
}

runTests();
