import { supabase } from '../../../integrations/supabase/client';

export class ProbabilityAnalyticsService {
    static async getGlobalAnalytics() {
        const { data, error } = await supabase
            .from('purchase_probabilities')
            .select('purchase_probability');
            
        if (error || !data) return null;

        const count = data.length;
        if (count === 0) return { avg: 0, highest: 0, count: 0 };

        const sum = data.reduce((acc, val) => acc + Number(val.purchase_probability), 0);
        const max = Math.max(...data.map(d => Number(d.purchase_probability)));

        return {
            avg: (sum / count).toFixed(1),
            highest: max.toFixed(1),
            count
        };
    }
}
