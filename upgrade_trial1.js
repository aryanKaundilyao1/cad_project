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
  console.log("Upgrading trial1@jasconnectt.in to client_premium...");
  
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
  
  // 2. Update profile
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      user_type: 'client',
      subscription_plan: 'premium',
      subscription_type: 'client_premium'
    })
    .eq('id', user.id);
    
  if (updateErr) {
    console.error("Error updating profile:", updateErr);
  } else {
    console.log("Successfully upgraded trial1@jasconnectt.in to premium!");
  }
}
run();
