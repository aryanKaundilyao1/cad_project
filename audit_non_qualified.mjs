import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      id,
      title,
      stage,
      order_probability,
      opportunity_strength,
      procurement_probability,
      confidence_overall,
      opportunity_intelligence (
        confidence,
        priority_level
      ),
      opportunity_priorities (
        priority_level
      ),
      account:accounts(name)
    `)
    .limit(1000);
    
  if (error) {
    console.error(`Error fetching:`, error);
    return;
  }
  
  // Task 1: Counts
  const { count: cSignalInstances } = await supabase.from('signal_instances').select('*', { count: 'exact', head: true });
  const { count: cOpportunitySignals } = await supabase.from('opportunity_signals').select('*', { count: 'exact', head: true });
  const { count: cSignalRegistry } = await supabase.from('signal_registry').select('*', { count: 'exact', head: true });
  const { count: cOpportunities } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
  
  console.log(`\n--- TASK 1: COUNTS ---`);
  console.log(`opportunities: ${cOpportunities}`);
  console.log(`signal_registry: ${cSignalRegistry}`);
  console.log(`signal_instances: ${cSignalInstances}`);
  console.log(`opportunity_signals: ${cOpportunitySignals}`);
  
  // Task 2: Check one opportunity
  console.log(`\n--- TASK 2: OPPORTUNITY TRACE ---`);
  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, title')
    .ilike('title', '%Ashtavinayak Prasad%')
    .limit(1);
    
  console.log(`\n--- TASK 3 & 4: JOBS AND FUNCTIONS ---`);
  
  // Try to find functions related to signals
  const { data: funcs } = await supabase.rpc('get_functions_with_signal', {}, { count: 'exact' }).catch(() => ({ data: null }));
  if (!funcs) {
     // fallback if no such RPC exists, just do a direct query using postgrest if possible
     // actually we can't easily query pg_proc through supabase js unless exposed.
     console.log('Cannot directly query pg_proc via standard REST.');
  }

  // Let's just search the codebase for where signals are supposed to be inserted
  // The user mentions "generate_signal_instances()" and "attach_signals_to_opportunity()".
}

runAudit();
