import { supabase } from '../../../integrations/supabase/client';
import { WeightOfEvidenceService } from './WeightOfEvidenceService';
import { InformationValueService } from './InformationValueService';

export class SignalImportanceService {
    /**
     * Rebuilds all WOE, IV, and Bayes Factor metrics for all signals in the registry.
     */
    static async rebuildAllMetrics() {
        // 1. Fetch total system baseline counts (Mocked for now, normally queries crm_outcomes)
        const totalSystemWon = 1000;
        const totalSystemLost = 1000;

        // 2. Fetch signal performance metrics
        const { data: metrics, error } = await supabase
            .from('signal_performance_metrics')
            .select('*');

        if (error || !metrics) return;

        // 3. Process each signal
        for (const m of metrics) {
            const woe = WeightOfEvidenceService.calculateWOE(m.won_occurrences, m.lost_occurrences, totalSystemWon, totalSystemLost);
            const bf = WeightOfEvidenceService.calculateBayesFactor(m.won_occurrences, m.lost_occurrences, totalSystemWon, totalSystemLost);
            const iv = InformationValueService.calculateIV(m.won_occurrences, m.lost_occurrences, totalSystemWon, totalSystemLost, woe);
            const classification = InformationValueService.classifyIV(iv);

            // Update DB
            await supabase.from('signal_performance_metrics').update({
                woe_value: woe,
                iv_score: iv,
                iv_classification: classification,
                bayes_factor: bf,
                bayes_support_type: bf > 1 ? 'Supports Purchase' : 'Supports Non-Purchase',
                last_updated: new Date().toISOString()
            }).eq('id', m.id);

            // Create Snapshot
            await supabase.from('evidence_snapshots').insert({
                signal_id: m.signal_id,
                woe: woe,
                iv: iv,
                bayes_factor: bf,
                sample_size: m.total_occurrences,
                version: 'v1.0'
            });
        }
    }
}
