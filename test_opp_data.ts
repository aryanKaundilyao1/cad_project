import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, opportunity_intelligence(*)')
    .limit(1);
  console.log(JSON.stringify(data, null, 2));
}
main();
