import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { count: nullOpps } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('account_id', null);
  const { count: accounts } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  const { count: jasCompanies } = await supabase.from('jas_companies').select('*', { count: 'exact', head: true });
  const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true });

  console.log(`SELECT COUNT(*) FROM opportunities WHERE account_id IS NULL: ${nullOpps}`);
  console.log(`SELECT COUNT(*) FROM accounts: ${accounts}`);
  console.log(`SELECT COUNT(*) FROM jas_companies: ${jasCompanies}`);
  console.log(`SELECT COUNT(*) FROM leads: ${leads}`);
}

run().catch(console.error);
