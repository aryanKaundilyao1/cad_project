import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const profileId = '00000000-0000-0000-0000-000000000000'; // dummy UUID
  const uploadId = '00000000-0000-0000-0000-000000000000';

  const mockLead = {
    title: 'Test Lead',
    location: 'Test Location',
    project_type: 'Imported',
    description: null,
    company_name: 'Test Lead',
    email: null,
    phone: null,
    website: null,
    quality_score: 0,
    industry_id: null,
    industry: null,
    niche: null,
    sub_niche: null,
    source_type: 'import',
    source_file: 'test.csv',
    uploaded_by: profileId,
    seller_id: profileId,
    status: 'Active',
    verification_status: 'verified',
    metadata: {
      rating: null,
      review_count: null,
      category: null,
      is_public: true,
      approved_at: new Date().toISOString(),
      source_upload_id: uploadId
    }
  };

  const { data, error } = await supabase.from('leads').insert([mockLead]).select('id');
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success:', data);
    // Cleanup
    await supabase.from('leads').delete().eq('id', data[0].id);
  }
}

testInsert();
