import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase.from('tasks').select('id, status').limit(1);
  if (data && data.length > 0) {
    const { error: err2 } = await supabase.from('tasks').update({ status: 'done' }).eq('id', data[0].id);
    console.log("Update to 'done':", err2 || "Success");
    // revert
    if (!err2) await supabase.from('tasks').update({ status: 'pending' }).eq('id', data[0].id);
  } else {
    console.log(error || "No tasks found");
  }
}
run();
