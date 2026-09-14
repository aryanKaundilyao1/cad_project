import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rescore() {
  console.log('Fetching opportunities...');
  const { data: opps, error: oppsError } = await supabase
    .from('opportunities')
    .select('*, legacy_lead_id');

  if (oppsError) {
    console.error(oppsError);
    return;
  }
  
  if (!opps || opps.length === 0) {
    console.log("No opportunities found.");
    return;
  }
  
  console.log(`Found ${opps.length} opportunities.`);
  
  // We need to fetch the raw leads for these opps to re-score them
  const leadIds = opps.map(o => o.legacy_lead_id).filter(Boolean);
  
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .in('id', leadIds);
    
  if (leadsError) {
    console.error(leadsError);
    return;
  }
  
  console.log(`Found ${leads?.length} corresponding leads. Rescoring...`);
  
  // Dynamic import to avoid ts-node module resolution issues with tsx/esbuild if any, 
  // or just run it via npx tsx
}

rescore();
