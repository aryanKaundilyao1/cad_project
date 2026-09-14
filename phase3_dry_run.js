import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== PHASE 3 DRY RUN ===");
  
  // 1. Fetch signal registry
  const { data: registry } = await supabase.from('signal_registry').select('id, name');
  const typeMap = {};
  registry.forEach(r => typeMap[r.name] = r.id);
  
  // Simulate Rules Configuration based on architecture document
  // Since db doesn't have these exact columns yet, we mock the architecture values
  const decayRules = {
    [typeMap['High Growth Indicators']]: { type: 'linear', linear_zero_at_days: 90 },
    [typeMap['Target Category Match']]: { type: 'none' }, // doesn't decay
    [typeMap['Verified Web Presence']]: { type: 'none' }  // doesn't decay
  };
  
  const confRules = {
    [typeMap['High Growth Indicators']]: { base: 60, max: 95, multi_bonus: 10 },
    [typeMap['Target Category Match']]: { base: 85, max: 100, multi_bonus: 5 },
    [typeMap['Verified Web Presence']]: { base: 70, max: 90, multi_bonus: 10 }
  };
  
  let totalOpps = 0;
  const confidences = [];
  
  let page = 0;
  while(true) {
    const { data: opps } = await supabase.from('opportunities').select('id, created_at, accounts(industry, website)').range(page*1000, (page+1)*1000-1);
    if (!opps || opps.length === 0) break;
    
    for (const opp of opps) {
      totalOpps++;
      
      const simulatedSignals = [];
      
      // Simulate High Growth
      // Random strength between 40-70 as per Phase 2
      const growthStrength = Math.floor(Math.random() * 30 + 40);
      simulatedSignals.push({
        type: typeMap['High Growth Indicators'],
        base_strength: growthStrength,
        detected_at: new Date(opp.created_at) // Assume detected at opp creation
      });
      
      if (opp.accounts && opp.accounts.industry) {
        simulatedSignals.push({
          type: typeMap['Target Category Match'],
          base_strength: 85,
          detected_at: new Date(opp.created_at)
        });
      }
      
      if (opp.accounts && opp.accounts.website && opp.accounts.website.trim() !== '') {
        simulatedSignals.push({
          type: typeMap['Verified Web Presence'],
          base_strength: 70,
          detected_at: new Date(opp.created_at)
        });
      }
      
      // Calculate Math per signal
      let sumWeight = 0;
      let sumConfWeight = 0;
      
      for (const sig of simulatedSignals) {
        // 1. Recency Multiplier
        let recency_multiplier = 1.0;
        const decay = decayRules[sig.type];
        if (decay && decay.type !== 'none') {
          const daysOld = (new Date().getTime() - sig.detected_at.getTime()) / (1000 * 60 * 60 * 24);
          if (decay.type === 'linear') {
             recency_multiplier = Math.max(0, 1.0 - (daysOld / decay.linear_zero_at_days));
          }
        }
        
        // 2. Resolve Confidence
        const cr = confRules[sig.type];
        // For simplicity, we assume 1 source in this simulation, so corroborating_sources = 0
        const corroborating_sources = 0; 
        const resolved_conf = Math.min(cr.max, cr.base + (cr.multi_bonus * corroborating_sources));
        
        // 3. Weight
        const weight = sig.base_strength * recency_multiplier;
        sumWeight += weight;
        sumConfWeight += resolved_conf * weight;
      }
      
      let oppConf = 0;
      if (sumWeight > 0) {
        oppConf = sumConfWeight / sumWeight;
      }
      confidences.push(oppConf);
    }
    page++;
  }
  
  if (confidences.length > 0) {
    const min = Math.min(...confidences).toFixed(2);
    const max = Math.max(...confidences).toFixed(2);
    const avg = (confidences.reduce((a,b)=>a+b,0) / confidences.length).toFixed(2);
    console.log(`Min Confidence: ${min}%`);
    console.log(`Max Confidence: ${max}%`);
    console.log(`Avg Confidence: ${avg}%`);
  }
}

run().catch(console.error);
