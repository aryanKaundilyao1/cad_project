import { supabase } from '@/integrations/supabase/client';
import { DecisionDecisionTrace } from '@/types/decision-intelligence';

export class DecisionTraceService {
    
    /**
     * Stores a full explainability trace so that a recommendation can be audited and understood.
     */
    static async captureTrace(traceData: Partial<DecisionDecisionTrace>) {
        const { data, error } = await supabase
            .from('decision_decision_traces')
            .insert([traceData])
            .select()
            .single();
            
        if (error) {
            console.error("Failed to capture decision trace:", error);
            throw error;
        }
        
        return data as DecisionDecisionTrace;
    }

    /**
     * Fetches traces for a specific company
     */
    static async getTracesByCompany(companyId: string) {
        const { data, error } = await supabase
            .from('decision_decision_traces')
            .select('*')
            .eq('company_id', companyId)
            .order('generated_at', { ascending: false });
            
        if (error) throw error;
        return data as DecisionDecisionTrace[];
    }
}
