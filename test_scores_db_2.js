import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Find upload_row with lead score > 0
  const { data: uploadRows } = await supabase.from('upload_rows')
    .select('id, raw_data, upload_id')
    .not('raw_data->>oie_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);
    
  for (const row of uploadRows) {
      if (row.raw_data.oie_score && row.raw_data.oie_score.lead_score > 50) {
          console.log(`Found Upload Row with Score > 50: ${row.raw_data.oie_score.lead_score}, Company: ${row.raw_data.company_name || row.raw_data.title}`);
          const { data: lead } = await supabase.from('leads').select('id').eq('title', row.raw_data.title).limit(1).maybeSingle();
          if (lead) {
              const { data: opp } = await supabase.from('opportunities').select('lead_score, icp_tier, oie_score').eq('legacy_lead_id', lead.id).maybeSingle();
              console.log("Migrated Opp:", opp);
          }
          break;
      }
  }
}
run();
