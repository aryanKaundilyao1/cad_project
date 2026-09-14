import { supabase } from '../../../integrations/supabase/client';

export class EvidenceAnalyticsService {
    static async getTopPositiveSignals(limit: number = 5) {
        const { data, error } = await supabase
            .from('signal_performance_metrics')
            .select('*, signal_evidence_registry(signal_name)')
            .order('woe_value', { ascending: false })
            .limit(limit);
        return error ? [] : data;
    }

    static async getMostPredictiveSignals(limit: number = 5) {
        const { data, error } = await supabase
            .from('signal_performance_metrics')
            .select('*, signal_evidence_registry(signal_name)')
            .order('iv_score', { ascending: false })
            .limit(limit);
        return error ? [] : data;
    }
}
