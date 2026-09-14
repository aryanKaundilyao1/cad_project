import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

async function testAsAuthenticated() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get a user
  const { data: users } = await supabaseAdmin.from('profiles').select('id, user_id').limit(1);
  const user = users[0];

  // Decode the service role key to get the JWT secret (often it's not the secret itself, but we can't get the JWT secret without the dashboard)
  // Wait, if I use supabase-js auth to sign in... I can just use a test user!
  const { data: authUser, error: signUpErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (signUpErr) {
    console.error('Signup error:', signUpErr);
    return;
  }

  // Sign in to get JWT
  const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const { data: sessionData, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: authUser.user.email,
    password: 'password123'
  });

  if (signInErr) {
    console.error('Signin error:', signInErr);
    return;
  }

  const token = sessionData.session.access_token;
  
  // Create payload
  const mockLead = { 
    company_name: 'Test Company',
    seller_id: user.id, // using existing valid profile id
    title: 'Test',
    location: 'Test',
    project_type: 'Test',
    niche: 'Real Estate'
  };

  // Perform fetch to REST API directly!
  const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
    method: 'POST',
    headers: {
      'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([mockLead])
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
  
  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
}

testAsAuthenticated();
