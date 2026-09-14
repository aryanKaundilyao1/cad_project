import { supabase } from '@/integrations/supabase/client';
import { DecisionVersion } from '@/types/decision-intelligence';
import { DecisionAuditService } from './DecisionAuditService';

export class DecisionVersionService {
    static async getVersions() {
        const { data, error } = await supabase.from('decision_versions').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (error) throw error;
        return data as DecisionVersion[];
    }

    static async getVersionById(id: string) {
        const { data, error } = await supabase.from('decision_versions').select('*').eq('id', id).single();
        if (error) throw error;
        return data as DecisionVersion;
    }

    static async createVersion(versionData: Partial<DecisionVersion>, userId?: string) {
        const { data, error } = await supabase
            .from('decision_versions')
            .insert([{ ...versionData, created_by: userId, updated_by: userId }])
            .select()
            .single();
            
        if (error) throw error;
        await DecisionAuditService.logEvent('version', data.id, 'CREATE', null, data, 'New version deployment', userId);
        return data as DecisionVersion;
    }
}
