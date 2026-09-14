import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: scores, error } = await supabase.from('opportunities').select('procurement_probability, contactability_score, opportunity_strength, order_probability, confidence_overall');
  if (error) { console.error(error); return; }

  const metrics = ['procurement_probability', 'contactability_score', 'opportunity_strength', 'order_probability', 'confidence_overall'];
  
  for (const metric of metrics) {
    const vals = scores.map(s => s[metric]).filter(v => v !== null).sort((a,b) => a - b);
    if (vals.length === 0) continue;
    
    const min = vals[0];
    const max = vals[vals.length - 1];
    const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
    const p10 = vals[Math.floor(vals.length * 0.1)];
    const p50 = vals[Math.floor(vals.length * 0.5)];
    const p90 = vals[Math.floor(vals.length * 0.9)];
    
    console.log(`-- ${metric.toUpperCase()} --`);
    console.log(`Min: ${min}`);
    console.log(`Max: ${max}`);
    console.log(`Avg: ${avg.toFixed(2)}`);
    console.log(`P10: ${p10}`);
    console.log(`P50: ${p50}`);
    console.log(`P90: ${p90}`);
    console.log("");
  }
}

run();
