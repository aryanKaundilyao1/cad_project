import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminLeadImport.tsx', 'utf-8');

const targetStart = "const leadsToProcess = deduplicatedLeads;";
const targetEnd = "      setImportStatus({type: 'success', message: `Successfully mapped and imported ${parsedRows.length} leads across ${selectedProductIds.length} products.`});\n      setStep(5);\n    } catch (err: any) {";

const replacement = `const leadsToProcess = deduplicatedLeads;
      // --- END DEDUPLICATION LOGIC ---

      const scoredResults = scoreBatch(leadsToProcess.map(l => ({
        id: l.upload_batch_id, // temp id
        company_name: l.company_name,
        source: 'GoogleMaps',
        ...l.raw_import
      } as unknown as RawLeadRecord)));

      const leadsWithScores = leadsToProcess.map((lead, index) => {
        const scoreResult = scoredResults.results[index];
        return {
          ...lead,
          current_score: scoreResult.lead_score || 0,
          current_confidence: scoreResult.conf.confidence_level || 'Unknown'
        };
      });

      const newLeadsToInsert = leadsWithScores.filter((l: any) => !l.existing_lead_id);
      const existingLeadsToUpdate = leadsWithScores.filter((l: any) => l.existing_lead_id);

      if (newLeadsToInsert.length > 0) {
        // Strip out existing_lead_id and raw_import if needed, but Supabase ignores unknown columns if not strict
        // Better to cleanly map them:
        const cleanNewLeads = newLeadsToInsert.map(({ existing_lead_id, duplicate_flag, ...rest }: any) => rest);
        
        const { data: insertedLeads, error } = await supabase.from('leads').insert(cleanNewLeads).select('id, company_name');
        if (error) throw error;

        if (insertedLeads && insertedLeads.length > 0) {
          const assignments: any[] = [];
          const opportunities: any[] = [];
          const generatedTasks: any[] = [];

          insertedLeads.forEach((lead, idx) => {
            const score = newLeadsToInsert[idx].current_score;
            
            selectedProductIds.forEach(productId => {
              assignments.push({
                lead_id: lead.id,
                client_id: companyId,
                product_id: productId,
                lifecycle_stage: 'Base Scored',
                status: 'New',
                is_contacted: false
              });
            });

            const oppId = crypto.randomUUID();
            opportunities.push({
              id: oppId,
              legacy_lead_id: lead.id,
              title: lead.company_name,
              workspace_id: companyId,
              lifecycle_stage: 'Base Scored',
              sales_status: 'New',
              stage: 'discovery',
              created_by: companyId
            });
            
            if (score >= 80) {
              generatedTasks.push({
                workspace_id: companyId,
                opportunity_id: oppId,
                title: \`High Intent Lead: Contact \${lead.company_name}\`,
                description: \`AI Engine scored this lead at \${score}. Recommended immediate outreach.\`,
                task_type: 'follow_up',
                priority: 'high',
                status: 'pending',
                due_date: new Date().toISOString(),
                created_by: companyId
              });
            }
          });

          const { error: assignError } = await supabase.from('assigned_leads').insert(assignments);
          if (assignError) throw assignError;

          const { error: oppError } = await supabase.from('opportunities').insert(opportunities);
          if (oppError) throw oppError;
          
          if (generatedTasks.length > 0) {
            await supabase.from('tasks').insert(generatedTasks);
          }
        }
      }

      if (existingLeadsToUpdate.length > 0) {
        // Prepare lead modules
        const modulesToInsert = existingLeadsToUpdate.map((l: any) => ({
          lead_id: l.existing_lead_id,
          module_type: 'GoogleMaps', // or derive from template
          raw_data: l.raw_import
        }));

        const { error: moduleError } = await supabase.from('lead_modules').insert(modulesToInsert);
        if (moduleError) throw moduleError;

        // Trigger edge function for all these updated leads
        const { error: invokeError } = await supabase.functions.invoke('run-client-scoring', {
          body: { leadIds: existingLeadsToUpdate.map((l: any) => l.existing_lead_id) }
        });
        if (invokeError) {
          console.error("Failed to invoke scoring engine:", invokeError);
        }
      }

      setImportStatus({type: 'success', message: \`Successfully processed \${parsedRows.length} leads (\${newLeadsToInsert.length} new, \${existingLeadsToUpdate.length} updated).\`});
      setStep(5);
    } catch (err: any) {`;

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd) + targetEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync('src/pages/admin/AdminLeadImport.tsx', content);
  console.log("Patched insertion logic successfully.");
} else {
  console.error("Could not find target strings for patching.", { startIndex, endIndex });
}
