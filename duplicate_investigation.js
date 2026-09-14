import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== TASK 1: SAMPLE DUPLICATES ===");
  // Find top duplicated legacy_lead_ids
  let allOpps = [];
  let page = 0;
  while(true) {
     const { data } = await supabase.from('opportunities').select('id, title, stage, source, created_at, legacy_lead_id').order('created_at', { ascending: true }).range(page*1000, (page+1)*1000-1);
     if (!data || data.length === 0) break;
     allOpps = allOpps.concat(data);
     page++;
  }

  const countsMap = {};
  allOpps.forEach(o => {
     if (o.legacy_lead_id) {
         if (!countsMap[o.legacy_lead_id]) countsMap[o.legacy_lead_id] = [];
         countsMap[o.legacy_lead_id].push(o);
     }
  });

  const duplicates = Object.entries(countsMap)
     .filter(([_, opps]) => opps.length > 1)
     .sort((a, b) => b[1].length - a[1].length);

  for (let i = 0; i < Math.min(20, duplicates.length); i++) {
     const [leadId, opps] = duplicates[i];
     console.log(`\nLead ID: ${leadId} (${opps.length} opportunities)`);
     opps.forEach((o, idx) => {
         console.log(`  Opp ${idx + 1}: ID=${o.id} | Created=${o.created_at} | Title=${o.title} | Stage=${o.stage} | Source=${o.source}`);
     });
  }

  console.log("\n=== TASK 4: TIMELINE TRACE FOR ONE LEAD ===");
  if (duplicates.length > 0) {
      const sample = duplicates[0][1];
      console.log(`Tracing lead: ${duplicates[0][0]}`);
      sample.forEach((o, idx) => {
          console.log(`  Opp ${idx + 1}: created_at=${o.created_at} | ID=${o.id} | Stage=${o.stage}`);
      });
  }

}

run().catch(console.error);
