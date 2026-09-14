import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Binding trial1@jasconnectt.in to Jumbl workspace...");
  
  // 1. Get user
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("Error fetching users:", usersErr);
    return;
  }
  const user = usersData.users.find(u => u.email === 'trial1@jasconnectt.in');
  if (!user) {
    console.error("User trial1@jasconnectt.in not found.");
    return;
  }
  
  // 2. Get Jumbl client
  const { data: clients, error: clientErr } = await supabase
    .from('jas_clients')
    .select('id')
    .eq('slug', 'jumbl');
    
  if (clientErr || !clients || clients.length === 0) {
    console.error("Jumbl client not found. Did you run the SQL migration?", clientErr);
    return;
  }
  const clientId = clients[0].id;
  
  // 3. Bind
  const { error: insertErr } = await supabase
    .from('jas_client_members')
    .upsert({
      client_id: clientId,
      user_id: user.id,
      role: 'OWNER',
      is_primary_client: true,
      status: 'ACTIVE'
    }, { onConflict: 'client_id,user_id' });
    
  if (insertErr) {
    console.error("Error binding user:", insertErr);
  } else {
    console.log("Successfully bound trial1@jasconnectt.in to Jumbl workspace!");
  }
}
run();
