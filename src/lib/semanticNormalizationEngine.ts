import { supabase } from '@/integrations/supabase/client';

export interface SemanticMapping {
  original_header: string;
  semantic_field: string;
}

export interface NormalizationParams {
  datasetId: string;
  onProgress?: (progress: number) => void;
}

export async function runSemanticNormalization({ datasetId, onProgress }: NormalizationParams) {
  let totalRecords = 0;
  let normalizedRecordsCount = 0;
  let duplicatesFound = 0;
  let duplicatesMerged = 0;
  let unknownFieldsCount = 0;
  let validationErrorsCount = 0;
  let failedRecords = 0;

  try {
    // 1. Fetch records
    const { data: records, error: recordsErr } = await supabase
      .from('dataset_records')
      .select('*')
      .eq('dataset_id', datasetId);

    if (recordsErr) throw recordsErr;
    if (!records || records.length === 0) return null;
    
    totalRecords = records.length;

    // 2. Fetch field mappings (source_id -> { original_header -> semantic_field })
    const { data: mappingsData, error: mapErr } = await supabase
      .from('field_mappings')
      .select('*');
    if (mapErr) throw mapErr;

    const sourceMappings: Record<string, Record<string, string>> = {};
    mappingsData?.forEach(m => {
      if (!sourceMappings[m.source_id]) sourceMappings[m.source_id] = {};
      sourceMappings[m.source_id][m.original_header] = m.semantic_field;
    });

    // 3. Process each record
    const BATCH_SIZE = 50;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      for (const record of batch) {
        try {
          const rawData = typeof record.raw_data === 'string' ? JSON.parse(record.raw_data) : record.raw_data;
          const sourceId = record.source_id;
          const mapping = sourceMappings[sourceId] || {};

          // Extract entities from raw data
          // Structure: entity_type -> { standard_fields: {}, custom_attributes: {} }
          const entitiesData: Record<string, { std: any, custom: any }> = {};

          Object.keys(rawData).forEach(header => {
            const val = rawData[header];
            if (val === undefined || val === null || val === '') return;

            const semanticPath = mapping[header]; // e.g., "company.name", "buyer.phone", "custom.special_notes"
            
            if (semanticPath) {
              const parts = semanticPath.split('.');
              const entityType = parts[0]; // company, buyer, project
              const fieldName = parts.slice(1).join('.'); // name, phone, or attribute name

              if (!entitiesData[entityType]) {
                entitiesData[entityType] = { std: {}, custom: {} };
              }

              // Check if it's a standard field for normalized_entities table
              const standardFields = ['name', 'phone', 'email', 'website', 'address', 'city', 'state', 'country', 'project_type', 'budget', 'project_size', 'deadline', 'location', 'description'];
              
              if (standardFields.includes(fieldName)) {
                entitiesData[entityType].std[fieldName] = val;
              } else {
                entitiesData[entityType].custom[fieldName] = val;
                unknownFieldsCount++;
              }
            } else {
              // Unmapped field -> store as 'raw_record' custom attribute or skip
              // According to req: "Unknown fields must never be lost. Do NOT create DB columns. Store as attributes."
              // We'll attach unknown fields to a generic "record" entity, or to the main entity if obvious.
              // For safety, let's attach unmapped fields to 'company' entity if it exists, otherwise 'record'.
              const targetEntity = entitiesData['company'] ? 'company' : 'record';
              if (!entitiesData[targetEntity]) {
                entitiesData[targetEntity] = { std: {}, custom: {} };
              }
              entitiesData[targetEntity].custom[header] = val;
              unknownFieldsCount++;
            }
          });

          // Insert or Merge Entities
          for (const [entityType, data] of Object.entries(entitiesData)) {
            // Validation
            if (entityType === 'company' && !data.std.name) {
              validationErrorsCount++;
              await supabase.from('validation_logs').insert([{
                dataset_record_id: record.id,
                entity_type: entityType,
                error_message: 'Missing company name'
              }]);
              continue; // Skip invalid entity
            }

            // Duplicate Detection (Basic Merge Strategy)
            let existingEntityId = null;
            if (data.std.name || data.std.email || data.std.phone || data.std.website) {
              // Build OR query
              let orQuery = [];
              if (data.std.name) orQuery.push(`name.ilike.%${data.std.name}%`);
              if (data.std.email) orQuery.push(`email.eq.${data.std.email}`);
              if (data.std.phone) orQuery.push(`phone.eq.${data.std.phone}`);
              if (data.std.website) orQuery.push(`website.eq.${data.std.website}`);

              if (orQuery.length > 0) {
                const { data: existing } = await supabase
                  .from('normalized_entities')
                  .select('id, name, email, phone, website')
                  .eq('entity_type', entityType)
                  .or(orQuery.join(','))
                  .limit(1);

                if (existing && existing.length > 0) {
                  existingEntityId = existing[0].id;
                  duplicatesFound++;
                }
              }
            }

            let finalEntityId = existingEntityId;

            if (existingEntityId) {
              // Merge (Update missing fields)
              // We would ideally fetch existing and only fill nulls, but for simplicity here we just update non-nulls.
              // A strict "fill nulls only" would require a select first.
              const { error: updateErr } = await supabase
                .from('normalized_entities')
                .update(data.std)
                .eq('id', existingEntityId);
              
              if (!updateErr) duplicatesMerged++;
            } else {
              // Create New
              const { data: newEnt, error: insErr } = await supabase
                .from('normalized_entities')
                .insert([{
                  dataset_record_id: record.id,
                  entity_type: entityType,
                  ...data.std
                }])
                .select('id')
                .single();

              if (!insErr && newEnt) {
                finalEntityId = newEnt.id;
                normalizedRecordsCount++;
              } else if (insErr) {
                console.error("Entity Insert Error:", insErr);
              }
            }

            // Insert custom attributes
            if (finalEntityId && Object.keys(data.custom).length > 0) {
              const attrInserts = Object.keys(data.custom).map(attrName => ({
                entity_id: finalEntityId,
                entity_type: entityType,
                attribute_name: attrName,
                attribute_value: String(data.custom[attrName]),
                source: record.source_name
              }));

              await supabase.from('entity_attributes').insert(attrInserts);
            }
          }

        } catch (e) {
          console.error("Record processing error:", e);
          failedRecords++;
        }
      }

      if (onProgress) {
        onProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / totalRecords) * 100)));
      }
    }

    // 4. Log Normalization Analytics
    await supabase.from('normalization_logs').insert([{
      dataset_id: datasetId,
      total_records: totalRecords,
      normalized_records: normalizedRecordsCount,
      duplicates_found: duplicatesFound,
      duplicates_merged: duplicatesMerged,
      unknown_fields: unknownFieldsCount,
      validation_errors: validationErrorsCount,
      failed_records: failedRecords
    }]);

  } catch (err) {
    console.error("Semantic Normalization Failed:", err);
    throw err;
  }

  return {
    totalRecords,
    normalizedRecordsCount,
    duplicatesFound,
    duplicatesMerged,
    unknownFieldsCount,
    validationErrorsCount,
    failedRecords
  };
}
