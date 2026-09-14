import { supabase } from '@/integrations/supabase/client';
import { DecisionRecommendation, RecommendationHistory } from '@/types/decision-intelligence';
import { DecisionAuditService } from './DecisionAuditService';

export class DecisionRecommendationService {
    
    /**
     * Fetches recommendations with advanced filtering, sorting, and pagination.
     */
    static async getRecommendations(options?: {
        company_id?: string;
        opportunity_id?: string;
        recommendation_type?: string;
        status?: string;
        version_id?: string;
        page?: number;
        limit?: number;
    }) {
        let query = supabase.from('decision_recommendations').select('*, companies(name)', { count: 'exact' }).is('deleted_at', null);

        if (options?.company_id) query = query.eq('company_id', options.company_id);
        if (options?.opportunity_id) query = query.eq('opportunity_id', options.opportunity_id);
        if (options?.recommendation_type) query = query.eq('recommendation_type', options.recommendation_type);
        if (options?.status) query = query.eq('recommendation_status', options.status);
        if (options?.version_id) query = query.eq('version_id', options.version_id);

        if (options?.page && options?.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }

        query = query.order('generated_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as any[], count };
    }

    static async getRecommendationById(id: string) {
        const { data, error } = await supabase.from('decision_recommendations').select('*').eq('id', id).single();
        if (error) throw error;
        return data as DecisionRecommendation;
    }

    /**
     * Creates a recommendation and automatically writes an immutable log to history.
     */
    static async createRecommendation(recData: Partial<DecisionRecommendation>, userId?: string) {
        const { data, error } = await supabase
            .from('decision_recommendations')
            .insert([{ ...recData, created_by: userId, updated_by: userId }])
            .select()
            .single();
            
        if (error) throw error;

        // Automatically log to immutable history table
        await this.logToHistory(data);

        // Log audit event
        await DecisionAuditService.logEvent('recommendation', data.id, 'CREATE', null, data, 'System generation', userId);
        
        return data as DecisionRecommendation;
    }

    /**
     * Updates a recommendation and logs audit. History table is append-only, 
     * but we can insert a new history record reflecting the state change if desired.
     */
    static async updateRecommendationStatus(id: string, newStatus: string, userId?: string, reason?: string) {
        const oldData = await this.getRecommendationById(id);
        
        const { data, error } = await supabase
            .from('decision_recommendations')
            .update({ recommendation_status: newStatus, updated_by: userId, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;

        // Log to immutable history table (state transition)
        await this.logToHistory(data);

        // Log audit event
        await DecisionAuditService.logEvent('recommendation', id, 'UPDATE', oldData, data, reason, userId);
        
        return data as DecisionRecommendation;
    }

    /**
     * Private helper to enforce immutable append-only history tracking.
     */
    private static async logToHistory(recommendation: DecisionRecommendation) {
        const { error } = await supabase
            .from('decision_recommendation_history')
            .insert({
                recommendation_id: recommendation.id,
                company_id: recommendation.company_id,
                recommendation_data: recommendation,
                version_id: recommendation.version_id,
                recorded_at: new Date().toISOString()
            });
            
        if (error) {
            console.error('CRITICAL: Failed to write to immutable recommendation history.', error);
            throw new Error('Failed to write recommendation history');
        }
    }
}
