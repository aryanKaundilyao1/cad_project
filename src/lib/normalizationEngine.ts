import { supabase } from '@/integrations/supabase/client';
import { FieldDictionary } from '@/types/importArchitecture';

export type DedupStrategy = 'skip' | 'merge' | 'create_new';
export type DedupKey = 'company_name' | 'website' | 'phone';

interface NormalizationParams {
  uploadId: string;
  sourceName: string;
  rows: any[]; // The validated, mapped rows
  templateFields: any[]; // The fields_json from the template
  dedupStrategy: DedupStrategy;
  dedupKey: DedupKey;
  onProgress?: (progress: number) => void;
}

export async function runNormalizationEngine({
  uploadId,
  sourceName,
  rows,
  templateFields,
  dedupStrategy,
  dedupKey,
  onProgress
}: NormalizationParams) {
  
  let companiesCreated = 0;
  let companiesUpdated = 0;
  let projectsCreated = 0;
  let failedRecords = 0;
  let duplicatesFound = 0;
  let customFieldsCaptured = 0;

  // Split fields by category for easy lookup
  const companyFields = templateFields.filter(f => f.field_category === 'company').map(f => f.key);
  const projectFields = templateFields.filter(f => f.field_category === 'project').map(f => f.key);
  const customFields = templateFields.filter(f => f.field_category === 'custom' || !f.field_category).map(f => f.key);

  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    // Process row by row within the batch for simplicity of merging logic
    for (const row of batch) {
      try {
        // Extract data
        const companyData: any = { source: sourceName };
        companyFields.forEach(k => { if (row[k] !== undefined && row[k] !== null && row[k] !== '') companyData[k] = row[k]; });
        
        const projectData: any = { source: sourceName };
        let hasProjectInfo = false;
        projectFields.forEach(k => { 
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
            projectData[k] = row[k]; 
            hasProjectInfo = true;
          }
        });

        const customData: any = {};
        customFields.forEach(k => { if (row[k] !== undefined && row[k] !== null && row[k] !== '') customData[k] = row[k]; });

        // DEDUPLICATION CHECK
        let existingCompanyId: string | null = null;
        let isDuplicate = false;

        if (companyData[dedupKey] && dedupStrategy !== 'create_new') {
          const { data: existing } = await supabase
            .from('companies')
            .select('id, company_name, website, phone, email, industry, niche, sub_niche, address, city, state, country, description')
            .eq(dedupKey, companyData[dedupKey])
            .limit(1);

          if (existing && existing.length > 0) {
            existingCompanyId = existing[0].id;
            isDuplicate = true;
            duplicatesFound++;
          }
        }

        let finalCompanyId = existingCompanyId;

        // HANDLE STRATEGY
        if (isDuplicate && dedupStrategy === 'skip') {
          // Do nothing for company, but maybe project/custom still runs? 
          // Usually skip means skip entire row.
          continue;
        }

        if (isDuplicate && dedupStrategy === 'merge') {
          // Fill nulls only
          const { data: existingData } = await supabase.from('companies').select('*').eq('id', finalCompanyId).single();
          const updatePayload: any = {};
          
          Object.keys(companyData).forEach(k => {
            if (existingData && (existingData[k] === null || existingData[k] === '')) {
              updatePayload[k] = companyData[k];
            }
          });

          if (Object.keys(updatePayload).length > 0) {
            const { error: updateErr } = await supabase.from('companies').update(updatePayload).eq('id', finalCompanyId);
            if (updateErr) throw updateErr;
            companiesUpdated++;
          }
        }

        if (!isDuplicate || dedupStrategy === 'create_new') {
          // Insert new company
          if (!companyData.company_name) {
            companyData.company_name = 'Unknown Company'; // required field fallback
          }
          const { data: newComp, error: insErr } = await supabase
            .from('companies')
            .insert([companyData])
            .select()
            .single();
            
          if (insErr) throw insErr;
          finalCompanyId = newComp.id;
          companiesCreated++;
        }

        // INSERT PROJECTS
        if (hasProjectInfo && finalCompanyId) {
          if (!projectData.project_name) projectData.project_name = 'Unknown Project';
          projectData.company_id = finalCompanyId;
          const { error: projErr } = await supabase.from('projects').insert([projectData]);
          if (projErr) throw projErr;
          projectsCreated++;
        }

        // INSERT CUSTOM ATTRIBUTES
        if (finalCompanyId && Object.keys(customData).length > 0) {
          const attrInserts = Object.keys(customData).map(k => ({
            company_id: finalCompanyId,
            attribute_name: k,
            attribute_value: String(customData[k]),
            source: sourceName
          }));
          const { error: attrErr } = await supabase.from('company_attributes').insert(attrInserts);
          if (attrErr) throw attrErr;
          customFieldsCaptured += attrInserts.length;
        }

        // LOGGING (optional, skipping per-row logging here for performance, we can just do summary)
        
      } catch (e) {
        console.error('Row failed:', e);
        failedRecords++;
      }
    }

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / rows.length) * 100)));
    }
  }

  // Insert a summary log into normalization_logs
  await supabase.from('normalization_logs').insert([{
    upload_id: uploadId,
    original_field: 'BATCH_SUMMARY',
    mapped_field: JSON.stringify({
      companiesCreated,
      companiesUpdated,
      projectsCreated,
      customFieldsCaptured,
      duplicatesFound,
      failedRecords
    }),
    status: 'mapped'
  }]);

  return {
    companiesCreated,
    companiesUpdated,
    projectsCreated,
    customFieldsCaptured,
    duplicatesFound,
    failedRecords
  };
}
