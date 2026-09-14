import { supabase } from "@/integrations/supabase/client";

export class ConnectorJobManager {
  
  static async createJob(sourceId: string): Promise<string> {
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        source_id: sourceId,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error("Failed to create import job:", error);
      throw error;
    }

    return data.id;
  }

  static async updateStatus(jobId: string, status: 'running' | 'completed' | 'failed', rowsFetched?: number): Promise<void> {
    const updatePayload: any = { status };
    if (status === 'completed' || status === 'failed') {
      updatePayload.completed_at = new Date().toISOString();
    }
    if (status === 'running') {
      updatePayload.started_at = new Date().toISOString();
    }
    if (rowsFetched !== undefined) {
      updatePayload.rows_fetched = rowsFetched;
    }

    const { error } = await supabase
      .from('import_jobs')
      .update(updatePayload)
      .eq('id', jobId);

    if (error) {
      console.error(`Failed to update job ${jobId} status to ${status}:`, error);
    }
  }

  static async logError(jobId: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('import_logs')
      .insert({
        job_id: jobId,
        level: 'error',
        message: message
      });

    if (error) {
      console.error("Failed to write to import_logs:", error);
    }
  }

  static async triggerProcessing(jobId: string, recordType: 'lead' | 'project' | 'tender', adminId: string): Promise<void> {
    let rpcName = '';
    if (recordType === 'lead') rpcName = 'process_import_job_leads';
    else if (recordType === 'project') rpcName = 'process_import_job_projects';
    else if (recordType === 'tender') rpcName = 'process_import_job_tenders';

    const { error } = await supabase.rpc(rpcName as any, { p_job_id: jobId, p_admin_id: adminId });
    
    if (error) {
      console.error(`Failed to trigger processing for job ${jobId}:`, error);
      await this.logError(jobId, `Engine Processing Failed: ${error.message}`);
      await this.updateStatus(jobId, 'failed');
      throw error;
    }
  }
}
