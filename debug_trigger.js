import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testInsert() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // get any upload
  const { data: uploads } = await supabase.from('uploads').select('*').limit(1);
  if (!uploads || uploads.length === 0) { console.log('No uploads'); return; }
  const upload = uploads[0];

  // get 100 rows to simulate a batch
  const { data: rows } = await supabase.from('upload_rows').select('raw_data').eq('upload_id', upload.id).limit(100);
  
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const profile = users[0];

  const leadsToInsert = rows.map((r) => {
    const row = r.raw_data || {};
    const title = row.title || row.company_name || row.project_name || 'Unknown Lead';
    const location = row.location || row.city || row.address || row.state || row.country || 'Unknown Location';
    const project_type = row.project_type || row.business_type || 'Imported';
    
    return {
      title,
      location,
      project_type,
      description: row.description || row.about || null,
      company_name: row.company_name || title,
      email: row.email || row.email_address || null,
      phone: row.phone || row.mobile || row.contact_number || row.telephone || null,
      website: row.website || row.url || row.domain || null,
      quality_score: row.oie_score?.lead_score || row.quality_score || 0,
      industry_id: null,
      industry: null,
      niche: null,
      sub_niche: null,
      source_type: 'import',
      source_file: upload.file_name,
      uploaded_by: profile?.id,
      seller_id: profile?.id,
      status: 'Active',
      verification_status: 'verified',
      metadata: { 
        ...row, 
        is_public: true,
        approved_at: new Date().toISOString(),
        source_upload_id: upload.id 
      }
    };
  });

  const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(leadsToInsert)
  });

  const text = await res.text();
  console.log('Status:', res.status);
  if (res.status !== 201) {
    console.log('Response:', text);
  } else {
    console.log('Success, inserted', leadsToInsert.length);
  }
}

testInsert();
