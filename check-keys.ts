import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('metadata');
  if (error || !leads) return;
  
  const keys = new Set();
  leads.forEach(l => {
    if (l.metadata) {
      Object.keys(l.metadata).forEach(k => keys.add(k));
    }
  });
  console.log(Array.from(keys).join(', '));
}

run();
