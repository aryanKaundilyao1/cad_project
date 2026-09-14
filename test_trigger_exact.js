import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const lead = {
    title: 'Test Exact Lead',
    location: 'Unknown Location',
    project_type: 'Imported',
    company_name: 'Test Exact Lead',
    email: null,
    phone: null,
    website: null,
    quality_score: 0,
    industry: 'Construction and Infrastructure',
    niche: 'Real Estate',
    source_type: 'import',
    seller_id: '1c5a5281-267b-4639-8557-0a6c4546895b',
    status: 'Active',
    verification_status: 'verified'
  };

  const { data, error } = await supabase.from('leads').insert([lead]);
  console.log("Error:", error);
}
run();
