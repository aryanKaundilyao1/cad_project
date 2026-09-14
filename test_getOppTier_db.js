import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, icp_tier, lead_score, opportunity_scores(*), leads(id, title, metadata)')
    .ilike('title', '%Suryawanshi%')
    .limit(1);
    
  if (error) console.error("Error:", error);
  const opp = data[0];
  console.log("Type of metadata:", typeof opp.leads.metadata);
  
  const getOppTier = (opp) => opp.icp_tier || opp.opportunity_scores?.[0]?.score_breakdown?.icp_tier || opp.leads?.metadata?.oie_score?.icp_tier || opp.opportunity_scores?.[0]?.score_breakdown?.data_tier || 'UNSCORED';
  
  console.log("Tier:", getOppTier(opp));
}
run();
