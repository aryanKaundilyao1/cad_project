import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testInsert() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_admin_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  // Insert profile so foreign keys pass
  await supabaseAdmin.from('profiles').insert({
    id: authUser.user.id,
    user_id: authUser.user.id,
    email: authUser.user.email,
    role: 'admin',
    full_name: 'Test Admin'
  });
  
  const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const { data: sessionData } = await supabaseAnon.auth.signInWithPassword({
    email: authUser.user.email,
    password: 'password123'
  });
  
  const token = sessionData.session.access_token;

  // get any upload
  const { data: uploads } = await supabaseAdmin.from('uploads').select('*').limit(1);
  const upload = uploads[0];

  // get 10 rows
  const { data: rows } = await supabaseAdmin.from('upload_rows').select('raw_data').eq('upload_id', upload.id).limit(10);
  
  const profile = { id: authUser.user.id };

  const leadsToInsert = rows.map((r) => {
    const row = r.raw_data || {};
    const title = row.title || row.company_name || row.project_name || 'Unknown Lead';
    return {
      title,
      location: row.location || 'Unknown Location',
      project_type: row.project_type || 'Imported',
      description: row.description || null,
      company_name: row.company_name || title,
      email: row.email || null,
      phone: row.phone || null,
      website: row.website || null,
      quality_score: row.quality_score || 0,
      industry_id: null,
      industry: null,
      niche: null,
      sub_niche: null,
      source_type: 'import',
      source_file: upload.file_name,
      uploaded_by: profile.id,
      seller_id: profile.id,
      status: 'Active',
      verification_status: 'verified',
      metadata: { 
        is_public: true,
      }
    };
  });

  const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
    method: 'POST',
    headers: {
      'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(leadsToInsert)
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
  
  await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
  await supabaseAdmin.from('profiles').delete().eq('id', authUser.user.id);
}

testInsert();
