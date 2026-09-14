import { supabase } from '@/integrations/supabase/client';
import { DecisionReasonCode } from '@/types/decision-intelligence';

export class ReasonCodeService {
    static async getReasonCodes(options?: { category?: string }) {
        let query = supabase.from('decision_reason_codes').select('*');
        if (options?.category) {
            query = query.eq('category', options.category);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as DecisionReasonCode[];
    }

    static async getReasonCodeByCode(code: string) {
        const { data, error } = await supabase.from('decision_reason_codes').select('*').eq('code', code).single();
        if (error) return null; // Safe fallback
        return data as DecisionReasonCode;
    }
}
