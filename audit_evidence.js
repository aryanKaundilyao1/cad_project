import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { count: total } = await s.from('accounts').select('id', { count: 'exact', head: true });
  const { count: rating } = await s.from('accounts').select('id', { count: 'exact', head: true }).not('rating', 'is', null);
  const { count: reviews } = await s.from('accounts').select('id', { count: 'exact', head: true }).not('reviews', 'is', null);
  const { count: industry } = await s.from('accounts').select('id', { count: 'exact', head: true }).not('industry', 'is', null);
  const { count: category } = await s.from('accounts').select('id', { count: 'exact', head: true }).not('category', 'is', null);
  const { count: website } = await s.from('accounts').select('id', { count: 'exact', head: true }).not('website', 'is', null);
  const { count: verifiedWebsite } = await s.from('accounts').select('id', { count: 'exact', head: true }).eq('website_verification_state', 'verified');
  
  console.log(`Total Accounts: ${total}`);
  console.log(`Rating available: ${rating}`);
  console.log(`Reviews available: ${reviews}`);
  console.log(`Industry available: ${industry}`);
  console.log(`Category available: ${category}`);
  console.log(`Website available: ${website}`);
  console.log(`Verified Website available: ${verifiedWebsite}`);
}
run();
