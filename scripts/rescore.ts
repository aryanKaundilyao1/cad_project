import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { scoreLead } from '../src/scoring/pipeline';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  
  const leadMap = new Map();
  leads?.forEach(l => leadMap.set(l.id, l));

  for (const opp of opps) {
    if (!opp.legacy_lead_id) continue;
    const rawLead = leadMap.get(opp.legacy_lead_id);
    if (!rawLead) continue;

    const result = scoreLead(rawLead as any);
    
    // Update opportunity
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ 
        lead_score: result.lead_score,
        icp_tier: result.icp_tier
      })
      .eq('id', opp.id);
      
    if (updateError) {
      console.error(`Error updating opp ${opp.id}:`, updateError);
    } else {
      console.log(`Updated opp ${opp.title}: Score ${result.lead_score}, Tier ${result.icp_tier}`);
    }
  }
  console.log('Done rescoring.');
}

rescore();
