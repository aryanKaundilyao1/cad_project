import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, ChevronRight, ChevronDown, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { Trash2, UploadCloud, Activity, Search, BrainCircuit } from 'lucide-react';
import { scoreLead } from '@/scoring/pipeline';
import CoifExecutionModal from './admin/CoifExecutionModal';

interface AdminDataViewerTabProps {
  onRunCoifComplete?: () => void;
}

export default function AdminDataViewerTab({ onRunCoifComplete }: AdminDataViewerTabProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth() as any;
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [selectedUpload, setSelectedUpload] = useState<any>(null);
  const [uploadRows, setUploadRows] = useState<any[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [coifUploadId, setCoifUploadId] = useState<string | null>(null);
  const [isCoifModalOpen, setIsCoifModalOpen] = useState(false);

  // Bulk Selection State
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uploadsRes, indRes, tmplRes] = await Promise.all([
        supabase.from('uploads').select('*').order('created_at', { ascending: false }),
        supabase.from('industries').select('id, name, type, parent_id'),
        supabase.from('templates').select('id, template_name')
      ]);

      const uploads = uploadsRes.data || [];
      const industries = indRes.data || [];
      const templates = tmplRes.data || [];

      // Group by Industry -> Template -> Uploads
      const indMap = new Map();

      uploads.forEach(u => {
        const ind = industries.find(i => i.id === u.industry_id);
        const tmpl = templates.find(t => t.id === u.template_id);
        
        const indName = ind ? ind.name : 'Unknown Industry';
        const tmplName = tmpl ? tmpl.template_name : 'Unknown Template';

        if (!indMap.has(indName)) {
          indMap.set(indName, { name: indName, type: 'industry', templates: new Map() });
        }
        
        const indNode = indMap.get(indName);
        if (!indNode.templates.has(tmplName)) {
          indNode.templates.set(tmplName, { name: tmplName, type: 'template', uploads: [] });
        }
        
        const tmplNode = indNode.templates.get(tmplName);
        tmplNode.uploads.push(u);
      });

      // Convert maps to arrays for rendering
      const tree = Array.from(indMap.values()).map(ind => ({
        ...ind,
        templates: Array.from(ind.templates.values())
      }));

      setHierarchy(tree);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleDatasetSelection = (id: string) => {
    const newSelected = new Set(selectedDatasetIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDatasetIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedDatasetIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedDatasetIds.size} datasets? This will remove all associated assignments and rows.`)) return;
    
    setProcessingId('bulk-delete');
    try {
      const { error } = await supabase.from('uploads').delete().in('id', Array.from(selectedDatasetIds));
      if (error) throw error;
      toast({ title: 'Datasets Deleted', description: `Successfully deleted ${selectedDatasetIds.size} datasets.` });
      setSelectedDatasetIds(new Set());
      fetchData();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedDatasetIds.size === 0) return;
    setProcessingId('bulk-archive');
    try {
      const { error } = await supabase.from('uploads').update({ status: 'archived' }).in('id', Array.from(selectedDatasetIds));
      if (error) throw error;
      toast({ title: 'Datasets Archived', description: `Successfully archived ${selectedDatasetIds.size} datasets.` });
      setSelectedDatasetIds(new Set());
      fetchData();
    } catch (err: any) {
      toast({ title: 'Archive Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const viewUploadData = async (upload: any) => {
    setSelectedUpload(upload);
    setIsModalOpen(true);
    setRowsLoading(true);
    try {
      const { data, error } = await supabase
        .from('upload_rows')
        .select('*')
        .eq('upload_id', upload.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setUploadRows(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRowsLoading(false);
    }
  };

  const handleScoreDataset = async (upload: any) => {
    setProcessingId(`score-${upload.id}`);
    try {
      let rows: any[] = [];
      let fetchCount = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: fetchErr } = await supabase
          .from('upload_rows')
          .select('*')
          .eq('upload_id', upload.id)
          .eq('validation_status', 'valid')
          .range(fetchCount, fetchCount + 999);
          
        if (fetchErr) throw fetchErr;
        
        if (batch && batch.length > 0) {
          rows = [...rows, ...batch];
          fetchCount += batch.length;
          // If we got fewer than 1000 rows, we've reached the end
          if (batch.length < 1000) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      if (!rows || rows.length === 0) {
        toast({ title: 'No Valid Rows', description: 'No valid rows found to score.' });
        return;
      }

      // Fetch the source name associated with this template
      let sourceName = 'Unknown Source';
      if (upload.template_id) {
        const { data: tmplData } = await supabase.from('templates').select('source_id').eq('id', upload.template_id).single();
        if (tmplData?.source_id) {
          const { data: srcData } = await supabase.from('sources').select('name').eq('id', tmplData.source_id).single();
          if (srcData) sourceName = srcData.name;
        }
      }

      let scoredCount = 0;
      for (let i = 0; i < rows.length; i += 500) {
        // Yield to the main thread to prevent UI freezing on large datasets
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const batch = rows.slice(i, i + 500);
        const updates = batch.map((r: any) => {
          const raw = r.raw_data || {};
          
          // Normalize keys for the OIE engine so it can find things like Phone, Website, etc.
          const normalizedRaw = {
            ...raw,
            source: raw.source || sourceName,
            company_name: raw.company_name || raw.title || raw.project_name || raw.Company,
            email: raw.email || raw.email_address || raw.Email,
            phone: raw.phone || raw.mobile || raw.contact_number || raw.telephone || raw.Phone,
            website: raw.website || raw.url || raw.domain || raw.Website,
            address: raw.address || raw.location || raw.city || raw.state || raw.country || raw.Address,
            rating: parseFloat(raw.rating || raw.google_rating || raw.Rating || '0'),
            review_count: parseInt(raw.review_count || raw.reviews || raw.total_reviews || raw.Reviews || '0', 10),
            category: raw.category || raw.business_category || raw.Category,
            description: raw.description || raw.about || raw.Description,
          };
          
          // Execute New OIE Engine
          const oieResult = scoreLead(normalizedRaw);
          
          // Inject explicit OIE breakdown columns into raw_data so they appear in the Admin grid
          raw['OIE: Score'] = oieResult.lead_score;
          raw['OIE: Tier'] = oieResult.icp_tier;
          raw['OIE: PROC'] = Math.round((oieResult.proc_score || 0) * 100);
          raw['OIE: CONT'] = Math.round((oieResult.cont_score || 0) * 100);
          raw['OIE: CONF'] = Math.round((oieResult.conf_score || 0) * 100);
          raw['OIE: FIT'] = Math.round((oieResult.fit_score || 0) * 100);
          raw['OIE: RISK'] = Math.round((oieResult.risk_score || 0) * 100);
          raw['OIE: QUAL'] = oieResult.qual_passed ? 'Pass' : 'Fail';
          raw['OIE: OPP Bucket'] = oieResult.opp_bucket || 'Unknown';
          
          // Also set legacy quality_score for backward compatibility of other scripts
          raw.quality_score = oieResult.lead_score;
          
          // Store entire result securely inside raw_data payload for transport
          raw.oie_score = oieResult;

          return { 
            id: r.id, 
            upload_id: r.upload_id, 
            raw_data: raw, 
            validation_status: r.validation_status,
            validation_errors: r.validation_errors || []
          };
        });

        const { error: upsertErr } = await supabase.from('upload_rows').upsert(updates, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
        scoredCount += batch.length;
      }

      toast({ title: 'Scoring Complete', description: `Successfully scored ${scoredCount} rows.` });
      fetchData(); // Refresh to see updated data if modal is open
    } catch (err: any) {
      toast({ title: 'Scoring Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunCoif = (upload: any) => {
    setCoifUploadId(upload.id);
    setIsCoifModalOpen(true);
  };

  const handleCoifSuccess = (mappedData: any) => {
    // Optionally trigger a callback to move to next tab
    if (onRunCoifComplete) {
      onRunCoifComplete();
    } else {
      fetchData(); // Refresh rows
    }
  };

  const handleUploadToLeadDatabase = async (upload: any) => {
    setProcessingId(`upload-${upload.id}`);
    try {
      const startTime = performance.now();
      
      // 1. Fetch valid rows (Paginated to bypass 1000 limit)
      let rows: any[] = [];
      let fetchCount = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: fetchErr } = await supabase
          .from('upload_rows')
          .select('raw_data')
          .eq('upload_id', upload.id)
          .eq('validation_status', 'valid')
          .range(fetchCount, fetchCount + 999);
          
        if (fetchErr) throw fetchErr;
        
        if (batch && batch.length > 0) {
          rows = [...rows, ...batch];
          fetchCount += batch.length;
          if (batch.length < 1000) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      if (!rows || rows.length === 0) {
        toast({ title: 'No Valid Rows', description: 'No valid rows found to insert.' });
        return;
      }
      
      // 1. Fetch valid profile ID since seller_id requires profiles.id NOT auth.users(id)
      let validProfileId = profile?.id;
      if (!validProfileId && user?.id) {
        const { data: p } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (p) validProfileId = p.id;
      }
      
      if (!validProfileId) {
        toast({ title: 'Error', description: 'Could not resolve your seller profile ID. Please check your account.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // 2. Fetch Industry Names
      const { data: tmplData } = await supabase.from('templates').select('industry_id, niche_id, sub_niche_id').eq('id', upload.template_id).single();
      
      let industryName = '';
      let nicheName = '';
      let subNicheName = '';

      if (tmplData) {
        const { data: indData } = await supabase.from('industries').select('id, name').in('id', [
          tmplData.industry_id, 
          tmplData.niche_id, 
          tmplData.sub_niche_id
        ].filter(Boolean));
        
        if (indData) {
          industryName = indData.find(i => i.id === tmplData.industry_id)?.name || '';
          nicheName = indData.find(i => i.id === tmplData.niche_id)?.name || '';
          subNicheName = indData.find(i => i.id === tmplData.sub_niche_id)?.name || '';
        }
      }

      // 3. Map to Leads schema
      const leadsToInsert = rows.map((r: any) => {
        const row = r.raw_data || {};
        const title = row.title || row.company_name || row.project_name || 'Unknown Lead';
        const location = row.location || row.city || row.address || row.state || row.country || 'Unknown Location';
        const project_type = row.project_type || row.business_type || 'Imported';
        
        const phone = row.phone || row.mobile || row.contact_number || row.telephone || null;
        const email = row.email || row.email_address || null;
        const website = row.website || row.url || row.domain || null;
        const category = row.category || row.business_category || null;
        const description = row.description || row.about || null;
        const rating = row.rating || row.google_rating || null;
        const review_count = row.review_count || row.reviews || row.total_reviews || null;

        return {
          title,
          location,
          project_type,
          description,
          company_name: row.company_name || title,
          email,
          phone,
          website,
          quality_score: row.oie_score?.lead_score || row.quality_score || 0,
          industry_id: tmplData?.industry_id || null,
          industry: industryName || null,
          niche: nicheName || null,
          sub_niche: subNicheName || null,
          source_type: 'import',
          source_file: upload.file_name,
          uploaded_by: validProfileId,
          seller_id: validProfileId,
          status: 'Active',
          verification_status: 'verified',
          is_public: row.mapped_company_id ? false : true,
          // Keep for backward compatibility, but assigned_leads is the new source of truth
          company_id: row.mapped_company_id || null,
          product_id: row.mapped_product_id || null,
          metadata: { 
            ...row, 
            rating,
            review_count,
            category,
            approved_at: new Date().toISOString(),
            source_upload_id: upload.id 
          },
          // Temporary fields
          _temp_oie_score: row.oie_score,
          _temp_coif_score: row.coif_score,
          _temp_mapped_company_id: row.mapped_company_id,
          _temp_mapped_category_id: row.mapped_category_id,
          _temp_mapped_product_id: row.mapped_product_id,
          _temp_mapped_sub_product_id: row.mapped_sub_product_id
        };
      });

      // 4. Basic deduplication: keep the last occurrence by company_name or phone
      const dedupedLeads = [];
      const seenKeys = new Set();
      
      // Reverse iterate to keep the latest if duplicates exist in the same batch
      for (let i = leadsToInsert.length - 1; i >= 0; i--) {
        const lead = leadsToInsert[i];
        const key = `${lead.company_name?.toLowerCase().trim() || ''}-${lead.phone?.trim() || ''}`;
        
        // Skip deduplication if both are missing or if it's just 'Unknown Lead'
        if (key !== '-' && key !== 'unknown lead-' && key !== 'unknown location-') {
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            dedupedLeads.unshift(lead);
          }
        } else {
          // No unique identifier, keep it to ensure all rows are inserted
          dedupedLeads.unshift(lead);
        }
      }

      // 5. Batch Insert Leads, Opportunities, and Scores
      let recordsInserted = 0;
      let failedBatches = 0;
      for (let i = 0; i < dedupedLeads.length; i += 100) {
        // Yield to the main thread
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const batch = dedupedLeads.slice(i, i + 100);
        
        // Strip temp fields for leads insertion
        const leadsBatch = batch.map(b => {
          const { _temp_oie_score, _temp_coif_score, _temp_mapped_company_id, _temp_mapped_category_id, _temp_mapped_product_id, _temp_mapped_sub_product_id, ...rest } = b;
          return rest;
        });

        const { data: insertedLeads, error: leadError } = await supabase.from('leads').insert(leadsBatch).select('id');
        
        if (leadError || !insertedLeads) {
          console.error(`Insert error at batch ${i}:`, leadError?.message || leadError);
          failedBatches++;
          continue;
        }

        const oppsBatch = [];
        const scoresBatch = [];
        const assignmentsBatch = [];
        
        for (let j = 0; j < insertedLeads.length; j++) {
           const leadId = insertedLeads[j].id;
           const oieScore = batch[j]._temp_oie_score;
           
           // If it was mapped via COIF, create an assigned_leads record
           if (batch[j]._temp_mapped_company_id) {
             assignmentsBatch.push({
               lead_id: leadId,
               client_id: batch[j]._temp_mapped_company_id,
               business_category_id: batch[j]._temp_mapped_category_id || null,
               product_id: batch[j]._temp_mapped_product_id || null,
               sub_product_id: batch[j]._temp_mapped_sub_product_id || null,
               oie_score: oieScore || {},
               coif_score: batch[j]._temp_coif_score || {},
               assigned_by: validProfileId,
               assigned_date: new Date().toISOString(),
               status: 'New',
               is_contacted: false
             });
           }
           
           if (!oieScore) continue; // Skip if not scored
           
           const oppId = crypto.randomUUID(); // Requires secure context, should work in Vite dev server
           oppsBatch.push({
             id: oppId,
             legacy_lead_id: leadId,
             title: batch[j].title,
             description: batch[j].description,
             workspace_id: validProfileId,
             sales_status: 'New', 
             stage: 'Discovery', // Leaving this for potential backwards compatibility for now
             lead_score: oieScore.lead_score,
             icp_tier: oieScore.icp_tier,
             oie_score: oieScore,
             created_by: validProfileId
           });
           
           scoresBatch.push({
             opportunity_id: oppId,
             lead_score: oieScore.lead_score || 0,
             score_breakdown: oieScore,
             score_version: oieScore.oie_version || 'oie-v1.0.0'
           });
        }
        
        if (assignmentsBatch.length > 0) {
          const { error: assignError } = await supabase.from('assigned_leads').insert(assignmentsBatch);
          if (assignError) console.error('Error inserting assignments', assignError);
        }

        if (oppsBatch.length > 0) {
          const { error: oppError } = await supabase.from('opportunities').insert(oppsBatch);
          if (oppError) console.error('Error inserting opps', oppError);
        }

        if (scoresBatch.length > 0) {
          const { error: scoreError } = await supabase.from('opportunity_scores').insert(scoresBatch);
          if (scoreError) console.error('Error inserting scores', scoreError);
        }

        recordsInserted += batch.length;
      }

      const endTime = performance.now();
      const timeInSeconds = ((endTime - startTime) / 1000).toFixed(1);
      const duplicates = rows.length - dedupedLeads.length;
      const failedRows = failedBatches * 100; // rough estimate based on batches

      if (failedBatches > 0) {
        toast({ 
          title: 'Partial Migration', 
          description: `Rows Uploaded: ${recordsInserted}\nRows Failed: ${failedRows}\nRows Skipped (Duplicates): ${duplicates}\nMigration Time: ${timeInSeconds}s`, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Migration Complete', 
          description: `Rows Uploaded: ${recordsInserted}\nRows Failed: 0\nRows Skipped (Duplicates): ${duplicates}\nScored Successfully: ${rows.length}\nMigration Time: ${timeInSeconds}s` 
        });
      }
    } catch (err: any) {
      toast({ title: 'Migration Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteDataset = async (upload: any) => {
    if (!window.confirm(`Are you sure you want to delete dataset ${upload.file_name}?`)) return;
    setProcessingId(`delete-${upload.id}`);
    try {
      const { error } = await supabase.from('uploads').delete().eq('id', upload.id);
      if (error) throw error;
      toast({ title: 'Dataset Deleted', description: 'The raw dataset has been deleted.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const renderUploadDataModal = () => {
    if (!selectedUpload) return null;

    // Get all unique keys from the raw_data JSONB across all rows to use as table headers
    const headers = new Set<string>();
    uploadRows.forEach(r => {
      if (r.raw_data) {
        Object.keys(r.raw_data).forEach(k => headers.add(k));
      }
    });
    const headerArr = Array.from(headers);

    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {selectedUpload.file_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4 rounded-md border border-white/10 bg-black/40">
            {rowsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : uploadRows.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">No data rows found for this upload.</div>
            ) : (
              <div className="overflow-x-auto relative">
                <Table>
                  <TableHeader className="bg-white/5 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-16 whitespace-nowrap text-white font-semibold">Status</TableHead>
                      {headerArr.map(h => (
                        <TableHead key={h} className="whitespace-nowrap text-white font-semibold">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadRows.map((row, idx) => (
                      <TableRow key={row.id || idx} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          {row.validation_status === 'valid' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-red-400" title={row.validation_errors?.join(', ')} />
                          )}
                        </TableCell>
                        {headerArr.map(h => (
                          <TableCell key={h} className="truncate max-w-[200px]" title={typeof row.raw_data?.[h] === 'object' ? JSON.stringify(row.raw_data?.[h]) : row.raw_data?.[h] || ''}>
                            {row.raw_data?.[h] ? (typeof row.raw_data[h] === 'object' ? JSON.stringify(row.raw_data[h]) : row.raw_data[h]) : <span className="text-muted-foreground/30">-</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle>Uploaded Data Explorer</CardTitle>
          <CardDescription>Browse all raw data uploaded to the system categorized by Industry and Template.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDatasetIds.size > 0 && (
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-300">{selectedDatasetIds.size} datasets selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 border-indigo-500/30 hover:bg-indigo-500/20" onClick={handleBulkArchive} disabled={!!processingId}>
                  Archive Selected
                </Button>
                <Button size="sm" variant="outline" className="h-8 border-red-500/30 hover:bg-red-500/20 text-red-400" onClick={handleBulkDelete} disabled={!!processingId}>
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {hierarchy.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data has been uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchy.map((ind) => (
                <div key={ind.name} className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
                  <div 
                    className="flex items-center gap-2 p-4 cursor-pointer hover:bg-white/[0.04] transition-colors font-semibold"
                    onClick={() => toggleNode(`ind-${ind.name}`)}
                  >
                    {expandedNodes.has(`ind-${ind.name}`) ? <ChevronDown className="w-5 h-5 text-indigo-400" /> : <ChevronRight className="w-5 h-5 text-indigo-400" />}
                    {ind.name}
                  </div>
                  
                  {expandedNodes.has(`ind-${ind.name}`) && (
                    <div className="border-t border-white/5 bg-black/20">
                      {ind.templates.map((tmpl: any) => (
                        <div key={tmpl.name} className="border-b border-white/5 last:border-0">
                          <div 
                            className="flex items-center gap-2 px-8 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors text-sm font-medium"
                            onClick={() => toggleNode(`tmpl-${ind.name}-${tmpl.name}`)}
                          >
                            {expandedNodes.has(`tmpl-${ind.name}-${tmpl.name}`) ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {tmpl.name}
                            <Badge variant="outline" className="ml-auto bg-white/5 border-white/10">{tmpl.uploads.length} Uploads</Badge>
                          </div>
                          
                          {expandedNodes.has(`tmpl-${ind.name}-${tmpl.name}`) && (
                            <div className="pl-16 pr-4 py-3 bg-black/40 space-y-2">
                              {tmpl.uploads.map((u: any) => (
                                <div key={u.id} className={`flex items-center justify-between p-3 rounded border transition-colors ${selectedDatasetIds.has(u.id) ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 cursor-pointer accent-indigo-500"
                                      checked={selectedDatasetIds.has(u.id)}
                                      onChange={() => toggleDatasetSelection(u.id)}
                                    />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-blue-100">{u.file_name}</span>
                                        {u.status === 'archived' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Archived</Badge>}
                                      </div>
                                      <span className="text-xs text-muted-foreground">Uploaded: {new Date(u.created_at).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
                                    <div className="flex gap-2 mb-1">
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{u.success_count} Valid</Badge>
                                      {u.failed_count > 0 && <Badge className="bg-red-500/10 text-red-400 border-red-500/20">{u.failed_count} Invalid</Badge>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button size="sm" variant="outline" className="bg-white/5 hover:bg-white/10 border-white/10 text-white h-7 text-xs" onClick={() => viewUploadData(u)}>
                                        <Search className="w-3 h-3 mr-1" /> View Dataset
                                      </Button>
                                      <Button size="sm" variant="outline" className="bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30 text-blue-100 h-7 text-xs" onClick={() => handleScoreDataset(u)} disabled={!!processingId}>
                                        {processingId === `score-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Activity className="w-3 h-3 mr-1" />} Score Dataset (OIE)
                                      </Button>
                                      <Button size="sm" variant="outline" className="bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-100 h-7 text-xs" onClick={() => handleRunCoif(u)} disabled={!!processingId}>
                                        <BrainCircuit className="w-3 h-3 mr-1" /> Run COIF
                                      </Button>
                                      <Button size="sm" variant="outline" className="bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/30 text-emerald-100 h-7 text-xs" onClick={() => handleUploadToLeadDatabase(u)} disabled={!!processingId}>
                                        {processingId === `upload-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UploadCloud className="w-3 h-3 mr-1" />} Publish
                                      </Button>
                                      <Button size="sm" variant="outline" className="bg-red-600/20 hover:bg-red-600/40 border-red-500/30 text-red-100 h-7 text-xs" onClick={() => handleDeleteDataset(u)} disabled={!!processingId}>
                                        {processingId === `delete-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />} Delete Dataset
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {renderUploadDataModal()}
      
      <CoifExecutionModal 
        isOpen={isCoifModalOpen}
        onClose={() => setIsCoifModalOpen(false)}
        uploadId={coifUploadId}
        onSuccess={handleCoifSuccess}
      />
    </div>
  );
}
