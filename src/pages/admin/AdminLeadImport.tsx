import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { scoreBatch } from '@/scoring/pipeline';
import type { RawLeadRecord } from '@/scoring/types';
import { Upload, ArrowLeft, CheckCircle, AlertCircle, Database, ChevronRight, FileSpreadsheet, Map, LayoutTemplate } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminLeadImport() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  
  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  
  // Products Hierarchy
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // CSV Data
  const [leadsCsvData, setLeadsCsvData] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  
  // Field Mapping: key = Template Field Key, value = CSV header
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  
  // State
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (companyId) fetchInitialData();
  }, [companyId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Company
      const { data: cData } = await supabase.from('jas_companies').select('*').eq('id', companyId).single();
      if (cData) setCompany(cData);

      // 2. Fetch Templates
      const { data: tData } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
      if (tData) setTemplates(tData);

      // 3. Fetch Client Categories & Products
      const { data: catData } = await supabase.from('client_business_categories').select('*').eq('company_id', companyId);
      if (catData && catData.length > 0) {
        setCategories(catData);
      }
      
      // Fetch all products for this company
      const { data: pData } = await supabase.from('jas_products').select('*').eq('company_id', companyId);
      if (pData) {
        setProducts(pData.map(p => ({ ...p, id: p.product_id || p.id })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleTemplateSelection = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find(t => t.id === id);
    if (tmpl && tmpl.fields_json) {
      setTemplateFields(tmpl.fields_json);
    } else {
      setTemplateFields([]);
    }
  };

  const parseCSV = () => {
    if (!leadsCsvData.trim()) {
      setImportStatus({type: 'error', message: 'Please paste CSV data.'});
      return;
    }
    
    const lines = leadsCsvData.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) {
      setImportStatus({type: 'error', message: 'CSV must contain at least a header row and one data row.'});
      return;
    }
    
    // Simple CSV parser for headers
    const headers = lines[0].split(',').map(h => h.trim());
    setCsvHeaders(headers);
    
    const rows = lines.slice(1).map(line => {
      const parts = line.split(',');
      const rowData: Record<string, string> = {};
      headers.forEach((h, i) => {
        rowData[h] = parts[i]?.trim() || '';
      });
      return rowData;
    });
    
    setParsedRows(rows);
    
    // Auto-map based on template fields
    const autoMap: Record<string, string> = {};
    headers.forEach(h => {
      const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      templateFields.forEach(tf => {
        const tfKeyLower = tf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const tfNameLower = tf.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (hLower === tfKeyLower || hLower === tfNameLower || hLower.includes(tfNameLower) || tfNameLower.includes(hLower)) {
          if (!autoMap[tf.key]) autoMap[tf.key] = h; // Assign first match
        }
      });
    });
    
    setFieldMap(autoMap);
    setStep(3);
    setImportStatus({type: 'idle', message: ''});
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId);
      return [...prev, productId];
    });
  };

  const handleImport = async () => {
    // Validate Required Fields
    const missingRequired = templateFields.filter(tf => tf.required && !fieldMap[tf.key]);
    if (missingRequired.length > 0) {
      setImportStatus({
        type: 'error', 
        message: `Missing required mappings: ${missingRequired.map(f => f.name).join(', ')}`
      });
      return;
    }

    if (selectedProductIds.length === 0) {
      setImportStatus({type: 'error', message: 'Please select at least one product.'});
      return;
    }

    setIsImporting(true);
    setImportStatus({type: 'idle', message: ''});

    try {
      const batchId = crypto.randomUUID();
      
      const newLeads = parsedRows.map(row => {
        // Collect raw mapped data
        const rawImport: Record<string, any> = { ...row }; // Save EVERYTHING
        // Ensure mapped keys are also explicitly set on standard keys for the engine
        templateFields.forEach(tf => {
          if (fieldMap[tf.key]) {
            rawImport[tf.key] = row[fieldMap[tf.key]];
          }
        });

        // Ensure fallback for required DB constraints if mapped weakly
        const companyName = rawImport['company_name'] || rawImport['firm_name'] || rawImport['title'] || 'Unknown Company';
        
        return {
          company_name: companyName,
          email: rawImport['email'] || null,
          phone: rawImport['phone'] || rawImport['mobile'] || null,
          website: rawImport['website'] || rawImport['url'] || null,
          raw_import: rawImport, // Store everything mapped
          client_id: companyId,
          seller_id: companyId,
          product_ids: selectedProductIds,
          template_id: selectedTemplateId,
          upload_batch_id: batchId,
          status: 'active'
        };
      });

      // Run Scoring Engine locally to assign Base Score immediately
      
      // --- DEDUPLICATION LOGIC ---
      // Fetch existing leads for this client to check for duplicates
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, company_name, website, phone, location')
        .eq('seller_id', companyId);
      
      const existingMap = new Map();
      const existingNames = new Map();
      if (existingLeads) {
        existingLeads.forEach(l => {
          if (l.website) existingMap.set(l.website.toLowerCase(), l.id);
          if (l.phone) existingMap.set(l.phone.replace(/[^0-9]/g, ''), l.id);
          if (l.company_name) existingNames.set(l.company_name.toLowerCase(), l.id);
        });
      }

      const deduplicatedLeads = [];
      const duplicateFlags = [];

      newLeads.forEach((lead) => {
        let isExactDuplicate = false;
        let isNearDuplicate = false;

        const web = lead.website ? lead.website.toLowerCase() : null;
        const ph = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : null;
        const name = lead.company_name ? lead.company_name.toLowerCase() : null;

        if ((web && existingMap.has(web)) || (ph && existingMap.has(ph))) {
          isExactDuplicate = true;
        } else if (name && existingNames.has(name)) {
          isNearDuplicate = true; // Same name, missing contact info match -> Near dup
        }

        const existingLeadId = (web && existingMap.has(web)) ? existingMap.get(web) 
          : (ph && existingMap.has(ph)) ? existingMap.get(ph) 
          : (name && existingNames.has(name)) ? existingNames.get(name) : null;

        if (existingLeadId) {
          // It's a duplicate. Save it to update existing lead with new module.
          lead.existing_lead_id = existingLeadId;
          deduplicatedLeads.push(lead);
        } else {
          deduplicatedLeads.push(lead);
        }
      });

      if (deduplicatedLeads.length === 0) {
        setImportStatus({type: 'error', message: 'No leads found to process.'});
        setIsImporting(false);
        return;
      }
      
      const leadsToProcess = deduplicatedLeads;
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
                title: `High Intent Lead: Contact ${lead.company_name}`,
                description: `AI Engine scored this lead at ${score}. Recommended immediate outreach.`,
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
          body: { lead_ids: existingLeadsToUpdate.map((l: any) => l.existing_lead_id) }
        });
        if (invokeError) {
          console.error("Failed to invoke scoring engine:", invokeError);
        }
      }

      setImportStatus({type: 'success', message: `Successfully processed ${parsedRows.length} leads (${newLeadsToInsert.length} new, ${existingLeadsToUpdate.length} updated).`});
      setStep(5);
    } catch (err: any) {
      console.error(err);
      setImportStatus({type: 'error', message: err.message || 'Failed to import leads.'});
    } finally {
      setIsImporting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4, 5].map(s => (
        <div key={s} className="flex items-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${step === s ? 'bg-primary text-white' : step > s ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
            {step > s ? <CheckCircle className="h-5 w-5" /> : s}
          </div>
          {s < 5 && <div className={`w-8 h-1 mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" className="mb-2 -ml-4" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8 text-primary" /> Universal Upload Pipeline
          </h1>
          <p className="text-muted-foreground">Mapping & CRM Injection for {company?.company_name}</p>
        </div>
      </div>

      {renderStepIndicator()}

      {importStatus.type === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription>{importStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: Select Template */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5"/> Choose Data Schema (Template)</CardTitle>
            <CardDescription>Select the template that defines the expected fields for this upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Import Template</Label>
              {templates.length === 0 ? (
                <div className="text-sm text-destructive italic">No templates available. Please create one in the Builder.</div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelection}>
                  <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                  <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            {templateFields.length > 0 && (
              <div className="p-4 bg-slate-50 border rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Expected Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {templateFields.map(tf => (
                    <span key={tf.key} className={`text-xs px-2 py-1 rounded-md border ${tf.required ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                      {tf.name} {tf.required && '*'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={() => setStep(2)} disabled={!selectedTemplateId}>
              Next: Provide CSV Data <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Paste CSV */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5"/> Provide CSV Data</CardTitle>
            <CardDescription>Paste your CSV data. Ensure the first row contains headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea 
              className="font-mono text-sm h-64" 
              placeholder="Firm Name, Email, Website, Phone&#10;Acme Corp, admin@acme.com, acme.com, 1234567890"
              value={leadsCsvData}
              onChange={e => setLeadsCsvData(e.target.value)}
            />
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={parseCSV}>Parse Headers & Map Fields <Map className="h-4 w-4 ml-2" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Map Columns */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5"/> Map CSV Columns</CardTitle>
            <CardDescription>Map your CSV headers to the template's expected fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateFields.map(field => (
                <div key={field.key} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                  <Label className="font-medium flex-1">
                    {field.name} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select value={fieldMap[field.key] || "none"} onValueChange={(val) => setFieldMap({...fieldMap, [field.key]: val === 'none' ? '' : val})}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Skip Field" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground italic">Skip Field</SelectItem>
                      {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(4)}>Next: Select Products <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Product Assignment */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Target Workspace Hierarchy</CardTitle>
            <CardDescription>Select the exact products to assign these leads to. You can select multiple.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {categories.length === 0 ? (
              <div className="text-sm text-destructive italic">Client has no business categories/products set up.</div>
            ) : (
              <div className="space-y-6">
                {categories.map(cat => (
                  <div key={cat.id} className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-semibold text-lg mb-3">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {products.filter(p => p.business_category_id === cat.id).map(prod => (
                        <div key={prod.id} className="flex items-center space-x-2 bg-white p-2 border rounded shadow-sm">
                          <Checkbox 
                            id={`prod-${prod.id}`}
                            checked={selectedProductIds.includes(prod.id)}
                            onCheckedChange={() => toggleProductSelection(prod.id)}
                          />
                          <Label htmlFor={`prod-${prod.id}`} className="flex-1 cursor-pointer">{prod.name}</Label>
                        </div>
                      ))}
                      {products.filter(p => p.business_category_id === cat.id).length === 0 && (
                        <div className="text-sm text-muted-foreground col-span-2">No products in this category.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button className="flex-1" onClick={handleImport} disabled={isImporting || selectedProductIds.length === 0}>
                {isImporting ? 'Processing & Uploading Leads...' : `Upload ${parsedRows.length} Leads to CRM`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Success */}
      {step === 5 && (
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="h-20 w-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold">Import Complete!</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {parsedRows.length} leads have been successfully mapped, stored, and assigned directly to the client's CRM.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" onClick={() => {
                setStep(1);
                setLeadsCsvData('');
                setFieldMap({});
                setSelectedProductIds([]);
              }}>Import More Leads</Button>
              <Button onClick={() => navigate('/admin/clients')}>Return to Client Manager</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
