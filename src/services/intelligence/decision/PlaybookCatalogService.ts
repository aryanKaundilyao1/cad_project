import { supabase } from '@/integrations/supabase/client';
import { DecisionPlaybook } from '@/types/decision-intelligence';
import { DecisionAuditService } from './DecisionAuditService';

export class PlaybookCatalogService {
    static async getPlaybooks(options?: { category?: string, status?: string }) {
        let query = supabase.from('decision_playbook_catalog').select('*').is('deleted_at', null);
        
        if (options?.category) query = query.eq('category', options.category);
        if (options?.status) query = query.eq('status', options.status);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as DecisionPlaybook[];
    }

    static async getPlaybookById(id: string) {
        const { data, error } = await supabase.from('decision_playbook_catalog').select('*').eq('id', id).single();
        if (error) throw error;
        return data as DecisionPlaybook;
    }

    static async createPlaybook(playbookData: Partial<DecisionPlaybook>, userId?: string) {
        const { data, error } = await supabase
            .from('decision_playbook_catalog')
            .insert([{ ...playbookData, created_by: userId, updated_by: userId }])
            .select()
            .single();
            
        if (error) throw error;
        await DecisionAuditService.logEvent('playbook', data.id, 'CREATE', null, data, 'Initial creation', userId);
        return data as DecisionPlaybook;
    }

    static async updatePlaybook(id: string, updates: Partial<DecisionPlaybook>, userId?: string, reason?: string) {
        const oldData = await this.getPlaybookById(id);
        
        const { data, error } = await supabase
            .from('decision_playbook_catalog')
            .update({ ...updates, updated_by: userId, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        await DecisionAuditService.logEvent('playbook', id, 'UPDATE', oldData, data, reason, userId);
        return data as DecisionPlaybook;
    }

    static async deletePlaybook(id: string, userId?: string, reason?: string) {
        const oldData = await this.getPlaybookById(id);
        const { error } = await supabase
            .from('decision_playbook_catalog')
            .update({ deleted_at: new Date().toISOString(), updated_by: userId })
            .eq('id', id);
            
        if (error) throw error;
        await DecisionAuditService.logEvent('playbook', id, 'DELETE', oldData, null, reason, userId);
    }
}
