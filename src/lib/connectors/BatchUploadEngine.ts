import { supabase } from "@/integrations/supabase/client";
import { RetryEngine } from "./RetryEngine";

export class BatchUploadEngine {
  static async uploadBatch(
    jobId: string, 
    recordType: 'lead' | 'project' | 'tender', 
    records: any[], 
    batchSize: number = 500
  ): Promise<void> {
    
    const tableName = recordType === 'lead' ? 'raw_leads' : 
                      recordType === 'project' ? 'raw_projects' : 'raw_tenders';

    // Enhance records with job_id and raw_json wrapper if needed
    const enhancedRecords = records.map(record => ({
      ...record,
      job_id: jobId,
      raw_json: record.raw_json || record // ensure raw_json exists
    }));

    for (let i = 0; i < enhancedRecords.length; i += batchSize) {
      const batch = enhancedRecords.slice(i, i + batchSize);
      
      await RetryEngine.withRetry(async () => {
        const { error } = await supabase
          .from(tableName)
          .insert(batch);
          
        if (error) {
          throw error;
        }
      });
    }
  }
}
