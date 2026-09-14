import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testInsert() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // get any upload
  const { data: uploads } = await supabase.from('uploads').select('*').limit(1);
  if (!uploads || uploads.length === 0) { console.log('No uploads'); return; }
  const upload = uploads[0];

  // get rows
  const { data: rows } = await supabase.from('upload_rows').select('raw_data').eq('upload_id', upload.id).limit(2);
  
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const profile = users[0];

  // the mapper logic
  const leadsToInsert = rows.map((r) => {
    const row = r.raw_data || {};
    const title = row.title || row.company_name || row.project_name || 'Unknown Lead';
    const location = row.location || row.city || row.address || row.state || row.country || 'Unknown Location';
    const project_type = row.project_type || row.business_type || 'Imported';
    
    const phone = row.phone || row.mobile || row.contact_number || row.telephone || null;
    const email = row.email || row.email_address || null;
    const website = row.website || row.url || row.domain || null;
    const category = row.category || row.business_category || null;
    const description = row.description || row.about || null;
    const rating = row.rating || row.google_rating || null;
    const review_count = row.review_count || row.reviews || row.total_reviews || null;

    return {
      title,
      location,
      project_type,
      description,
      company_name: row.company_name || title,
      email,
      phone,
      website,
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
        rating,
        review_count,
        category,
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
  console.log('Response:', text);
  if (res.status === 400) {
    console.log('Failing Payload:', JSON.stringify(leadsToInsert, null, 2));
  }
}

testInsert();
