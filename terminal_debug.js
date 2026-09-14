import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Fetch latest upload rows
  const { data: uploadRows } = await supabase.from('upload_rows').select('*').not('raw_data->>oie_score', 'is', null).order('created_at', { ascending: false }).limit(5);
  
  for (const row of uploadRows) {
    const raw = row.raw_data;
    const oie = raw.oie_score || {};
    
    console.log(`\nUpload Row: ${row.id}`);
    console.log(`Company: ${raw.company_name || raw.title}`);
    console.log(`Dataset Lead Score: ${oie.lead_score}`);
    
    const { data: lead } = await supabase.from('leads').select('id, title, company_name').eq('company_name', raw.company_name || raw.title).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    if (lead) {
      console.log(`Lead ID: ${lead.id}`);
      
      const { data: opp } = await supabase.from('opportunities').select('*, opportunity_scores(*)').eq('legacy_lead_id', lead.id).maybeSingle();
      if (opp) {
        console.log(`Migrated Lead Score (Opp): ${opp.lead_score}`);
        console.log(`Migrated Tier (Opp): ${opp.icp_tier}`);
        
        if (opp.opportunity_scores && opp.opportunity_scores.length > 0) {
            const score = opp.opportunity_scores[0].score_breakdown || {};
            console.log(`Discovery Lead Score (Scores Table): ${score.lead_score}`);
        }
      }
    } else {
      console.log("No Migrated Lead found for this upload row.");
    }
  }
}
run();
