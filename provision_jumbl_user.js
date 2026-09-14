import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Service Role credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  try {
    // 1. Get Jumbl client ID
    const { data: clients, error: clientErr } = await supabase
      .from('jas_clients')
      .select('id')
      .eq('slug', 'jumbl');
      
    if (clientErr) throw clientErr;
    if (!clients || clients.length === 0) {
      console.log("Jumbl client not found. Run migrations first.");
      return;
    }
    const clientId = clients[0].id;

    // 2. Try to lookup the user by email using admin API
    const userEmail = 'founder@jumbl.in';
    const { data: adminUsers, error: userErr } = await supabase.auth.admin.listUsers();
    if (userErr) {
      console.log("Unable to list auth users. Make sure you are using the SERVICE_ROLE_KEY.");
      return;
    }

    const user = adminUsers.users.find(u => u.email === userEmail);
    if (!user) {
      console.log(`User ${userEmail} not found in auth.users. Please create them first.`);
      return;
    }

    // 3. Create membership
    const { error: memErr } = await supabase
      .from('jas_client_members')
      .insert({
        client_id: clientId,
        user_id: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        is_primary_client: true
      });

    if (memErr) {
      if (memErr.code === '23505') {
        console.log(`User ${userEmail} is already a member of Jumbl.`);
      } else {
        throw memErr;
      }
    } else {
      console.log(`Successfully provisioned ${userEmail} as OWNER of Jumbl tenant.`);
    }

  } catch (e) {
    console.error("Error provisioning Jumbl user:", e);
  }
}

run();

    // 4. Update the user's profile to have client_premium role
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ role: 'client_premium' })
      .eq('id', user.id);
      
    if (profileErr) {
      console.log("Failed to update profile role:", profileErr);
    } else {
      console.log("Updated user profile role to client_premium.");
    }
