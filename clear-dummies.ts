import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const dummyNames = [
    'Garcia', 'Johnson', 'Davis', 'Smith', 'Miller', 
    'Rodriguez', 'Williams', 'Martinez', 'Brown', 'Jones',
    'Test Company', 'Trigger Test Co', 'FKEY Test'
  ];
  
  let deletedCount = 0;
  for (const name of dummyNames) {
    const { data, error } = await supabase.from('leads').select('id').ilike('company_name', `${name}%`);
    if (data && data.length > 0) {
      const ids = data.map(d => d.id);
      await supabase.from('leads').delete().in('id', ids);
      deletedCount += ids.length;
    }
  }
  
  console.log(`Deleted ${deletedCount} dummy leads.`);
}

run();
