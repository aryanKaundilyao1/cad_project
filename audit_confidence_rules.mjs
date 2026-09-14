import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("--- 1. AUDIT SIGNAL CONFIDENCE RULES ---");
  const { data: rules } = await supabase.from('signal_confidence_rules')
    .select('signal_type_id, source_type, base_confidence, signal_registry(name)');
  
  for (const rule of rules || []) {
    console.log(`Signal Type: ${rule.signal_registry?.name || rule.signal_type_id}, Source: ${rule.source_type}, Base Confidence: ${rule.base_confidence}`);
  }

  console.log("\n--- 2. AUDIT SIGNAL INSTANCES (First 20 Opportunities) ---");
  const { data: opps } = await supabase.from('opportunities').select('id').limit(20);
  
  for (const opp of opps || []) {
    console.log(`\nOpportunity: ${opp.id}`);
    const { data: sigs } = await supabase.from('opportunity_signals')
      .select('signal_instance_id, signal_instance:signal_instances(signal_registry(name), strength, source_type)')
      .eq('opportunity_id', opp.id);
      
    // Because opportunity_signals might not have opportunity_id populated if it relies on intelligence ID:
    const { data: intel } = await supabase.from('opportunity_intelligence').select('id').eq('opportunity_id', opp.id).single();
    if (intel) {
       const { data: intelSigs } = await supabase.from('opportunity_signals')
        .select('signal_instance_id, signal_instance:signal_instances(signal_registry(name), strength, source_type, source)')
        .eq('opportunity_intelligence_id', intel.id);
        
       for (const sig of intelSigs || []) {
         const si = sig.signal_instance;
         console.log(`  Signal: ${si.signal_registry?.name}, Strength: ${si.strength}, SourceType: ${si.source_type}, Source: ${si.source}`);
       }
    }
  }
}

runAudit();
