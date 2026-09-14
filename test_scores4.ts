import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: opp, error } = await supabase.from('opportunities').select('workspace_id, legacy_lead_id, id').eq('id', '89fa7117-0519-4ddd-abd1-28065eab68bd').single();
  console.log('Opp:', opp);
  if (opp) {
    const { data: score } = await supabase.from('user_lead_scores').select('*').eq('lead_id', opp.legacy_lead_id);
    console.log('Score:', score);
  }
}
main();
