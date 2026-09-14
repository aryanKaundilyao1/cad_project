import { supabase } from '@/integrations/supabase/client';
import { DecisionAction } from '@/types/decision-intelligence';
import { DecisionAuditService } from './DecisionAuditService';

export class ActionCatalogService {
    static async getActions(options?: { action_type?: string, status?: string }) {
        let query = supabase.from('decision_action_catalog').select('*').is('deleted_at', null);
        
        if (options?.action_type) query = query.eq('action_type', options.action_type);
        if (options?.status) query = query.eq('status', options.status);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as DecisionAction[];
    }

    static async getActionById(id: string) {
        const { data, error } = await supabase.from('decision_action_catalog').select('*').eq('id', id).single();
        if (error) throw error;
        return data as DecisionAction;
    }

    static async createAction(actionData: Partial<DecisionAction>, userId?: string) {
        const { data, error } = await supabase
            .from('decision_action_catalog')
            .insert([{ ...actionData, created_by: userId, updated_by: userId }])
            .select()
            .single();
            
        if (error) throw error;
        await DecisionAuditService.logEvent('action', data.id, 'CREATE', null, data, 'Initial creation', userId);
        return data as DecisionAction;
    }

    static async updateAction(id: string, updates: Partial<DecisionAction>, userId?: string, reason?: string) {
        const oldData = await this.getActionById(id);
        
        const { data, error } = await supabase
            .from('decision_action_catalog')
            .update({ ...updates, updated_by: userId, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        await DecisionAuditService.logEvent('action', id, 'UPDATE', oldData, data, reason, userId);
        return data as DecisionAction;
    }

    static async deleteAction(id: string, userId?: string, reason?: string) {
        const oldData = await this.getActionById(id);
        const { error } = await supabase
            .from('decision_action_catalog')
            .update({ deleted_at: new Date().toISOString(), updated_by: userId })
            .eq('id', id);
            
        if (error) throw error;
        await DecisionAuditService.logEvent('action', id, 'DELETE', oldData, null, reason, userId);
    }
}
