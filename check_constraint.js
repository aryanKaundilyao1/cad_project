import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('query_db', { query: `
    SELECT pg_get_constraintdef(c.oid) AS constraint_def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'crm_leads_source_type_check';
  `});
  
  if (error) {
    console.error('Error with RPC:', error);
    // Let's just try to insert and see the exact error message
    const { error: insertError } = await supabase.from('crm_leads').insert([
        { source_type: 'auto', name: 'Test' }
    ]);
    console.log('Insert error with auto:', insertError);

    const { error: insertError2 } = await supabase.from('crm_leads').insert([
        { source_type: 'import', name: 'Test' }
    ]);
    console.log('Insert error with import:', insertError2);
  } else {
    console.log('Constraint Definition:', data);
  }
}

checkConstraint();
