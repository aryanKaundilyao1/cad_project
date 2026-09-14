import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  const signalTypes = [
    'High Growth Indicators',
    'Target Category Match',
    'Verified Web Presence'
  ];

  for (const st of signalTypes) {
    console.log(`\n--- Signal Type: ${st} ---`);
    const { data: reg } = await supabase.from('signal_registry').select('id').eq('name', st).single();
    if (!reg) {
      console.log('Not found in registry');
      continue;
    }
    const { data: instances } = await supabase.from('signal_instances')
      .select('raw_payload')
      .eq('signal_registry_id', reg.id)
      .not('raw_payload', 'is', null)
      .limit(3);
    
    for (const inst of instances || []) {
      console.log(JSON.stringify(inst.raw_payload, null, 2));
    }
  }
}

runAudit();
