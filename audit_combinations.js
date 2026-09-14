import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: opps } = await s.from('opportunities').select('*');
  const { data: intelligences } = await s.from('opportunity_intelligence').select('id, opportunity_id');
  const { data: signals } = await s.from('opportunity_signals').select('opportunity_intelligence_id');
  
  const intelToOpp = {};
  intelligences.forEach(i => intelToOpp[i.id] = i.opportunity_id);
  
  const oppSignalCounts = {};
  signals.forEach(s => {
    const oppId = intelToOpp[s.opportunity_intelligence_id];
    oppSignalCounts[oppId] = (oppSignalCounts[oppId] || 0) + 1;
  });
  
  const combos = {};
  
  for (const opp of opps) {
    const sigCount = oppSignalCounts[opp.id] || 0;
    const conf = Number(opp.confidence_overall || 0).toFixed(1);
    const cont = Number(opp.contactability_score || 0).toFixed(1);
    const proc = Number(opp.procurement_probability || 0).toFixed(1);
    
    const key = `${sigCount} / ${conf} / ${cont} / ${proc}`;
    combos[key] = (combos[key] || 0) + 1;
  }
  
  const sorted = Object.entries(combos).sort((a, b) => b[1] - a[1]).slice(0, 20);
  
  for (const [key, count] of sorted) {
    console.log(`${key}\ncount = ${count}\n`);
  }
}
run();
