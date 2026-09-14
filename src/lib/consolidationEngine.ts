import { supabase } from '@/integrations/supabase/client';

interface ConsolidationParams {
  uploadId: string;
  industryId: string;
  sourceId: string;
  sourceName: string;
  fileName: string;
  rows: any[]; // The validated, mapped rows
  onProgress?: (progress: number) => void;
}

export async function runConsolidationEngine({
  uploadId,
  industryId,
  sourceId,
  sourceName,
  fileName,
  rows,
  onProgress
}: ConsolidationParams) {
  
  let recordsInserted = 0;
  let failedRecords = 0;

  try {
    // 1. Get or create Industry Dataset
    let datasetId: string;
    
    // First try to find existing dataset for this industry
    const { data: existingDataset, error: getErr } = await supabase
      .from('industry_datasets')
      .select('id, record_count, source_count')
      .eq('industry_id', industryId)
      .maybeSingle();
      
    if (getErr) throw getErr;

    if (existingDataset) {
      datasetId = existingDataset.id;
    } else {
      // Create new dataset
      // Need to get industry name first
      const { data: industry } = await supabase
        .from('industries')
        .select('name')
        .eq('id', industryId)
        .single();
        
      const datasetName = industry ? `${industry.name} Dataset` : 'New Industry Dataset';
      
      const { data: newDataset, error: createErr } = await supabase
        .from('industry_datasets')
        .insert([{
          industry_id: industryId,
          dataset_name: datasetName,
          record_count: 0,
          source_count: 0
        }])
        .select('id')
        .single();
        
      if (createErr) throw createErr;
      datasetId = newDataset.id;
    }

    // 2. Add Dataset Source
    const { error: sourceErr } = await supabase
      .from('dataset_sources')
      .insert([{
        dataset_id: datasetId,
        source_id: sourceId,
        upload_id: uploadId,
        file_name: fileName,
        record_count: rows.length
      }]);
      
    if (sourceErr) throw sourceErr;

    // 3. Insert Records
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      const recordsToInsert = batch.map(row => ({
        dataset_id: datasetId,
        source_id: sourceId,
        source_name: sourceName,
        upload_id: uploadId,
        file_name: fileName,
        raw_data: row
      }));

      const { error: insertErr } = await supabase
        .from('dataset_records')
        .insert(recordsToInsert);
        
      if (insertErr) {
        console.error('Batch insert failed:', insertErr);
        failedRecords += batch.length;
      } else {
        recordsInserted += batch.length;
      }

      if (onProgress) {
        onProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / rows.length) * 100)));
      }
    }
    
    // 4. Update Dataset Aggregates
    // We update the record_count and source_count
    // The easiest way is to recalculate from dataset_sources
    const { data: sourcesData, error: aggErr } = await supabase
      .from('dataset_sources')
      .select('id, record_count')
      .eq('dataset_id', datasetId);
      
    if (!aggErr && sourcesData) {
      const totalRecords = sourcesData.reduce((sum, src) => sum + (src.record_count || 0), 0);
      const totalSources = sourcesData.length;
      
      await supabase
        .from('industry_datasets')
        .update({
          record_count: totalRecords,
          source_count: totalSources,
          updated_at: new Date().toISOString()
        })
        .eq('id', datasetId);
    }

  } catch (err) {
    console.error('Consolidation failed:', err);
    throw err;
  }

  return {
    recordsInserted,
    failedRecords
  };
}
