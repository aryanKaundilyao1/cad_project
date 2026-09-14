import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DeduplicationEngine } from '@/lib/deduplicationEngine';

const UNIVERSAL_FIELDS = [
  'company_name', 'contact_person', 'website', 'email', 'phone', 
  'address', 'city', 'state', 'country', 'industry', 'sub_industry', 
  'description', 'source', 'project_name', 'project_stage', 
  'project_cost', 'project_location', 'capacity', 'notes', 'IGNORE'
];

export default function AdminImportMapper({ batchId, onComplete }: { batchId: string, onComplete: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [batch, setBatch] = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (batchId) fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('import_staging').select('*').eq('id', batchId).single();
      if (error) throw error;
      
      setBatch(data);
      generateSuggestions(data.raw_headers || []);
    } catch (err: any) {
      toast({ title: 'Error loading batch', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = (headers: string[]) => {
    const suggestions: Record<string, string> = {};
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes('project name')) suggestions[h] = 'project_name';
      else if (lower.includes('company') || lower.includes('promoter')) suggestions[h] = 'company_name';
      else if (lower.includes('website')) suggestions[h] = 'website';
      else if (lower.includes('email')) suggestions[h] = 'email';
      else if (lower.includes('phone') || lower.includes('contact number')) suggestions[h] = 'phone';
      else if (lower.includes('director') || lower.includes('person')) suggestions[h] = 'contact_person';
      else if (lower.includes('address') || lower.includes('office')) suggestions[h] = 'address';
      else if (lower.includes('city') || lower.includes('location')) suggestions[h] = 'project_location';
      else if (lower.includes('cost') || lower.includes('value')) suggestions[h] = 'project_cost';
      else if (lower.includes('stage') || lower.includes('status')) suggestions[h] = 'project_stage';
      else if (lower.includes('capacity')) suggestions[h] = 'capacity';
      else if (lower.includes('industry')) suggestions[h] = 'industry';
      else if (lower.includes('desc') || lower.includes('details')) suggestions[h] = 'description';
      else suggestions[h] = 'IGNORE';
    });
    setMappings(suggestions);
  };

  const handleConfirmMapping = async () => {
    setProcessing(true);
    try {
      const rawRows = batch.raw_row_data || [];
      const headers = batch.raw_headers || [];

      // Phase 9: Normalization Engine (happens during mapping conversion)
      const mappedLeads = rawRows.map((row: string[]) => {
        const lead: any = { status: 'PENDING', source: 'CSV_IMPORT' };
        headers.forEach((h: string, i: number) => {
          const targetField = mappings[h];
          if (targetField && targetField !== 'IGNORE' && row[i]) {
            lead[targetField] = row[i];
          }
        });
        return lead;
      });

      // Filter out empty rows (where we couldn't even extract a company or project name)
      const validLeads = mappedLeads.filter((l: any) => l.company_name || l.project_name || l.description);

      if (validLeads.length === 0) throw new Error("No valid records found after mapping.");

      // Insert into raw_leads
      const { error: insertError } = await supabase.from('raw_leads').insert(validLeads);
      if (insertError) throw insertError;

      // Update staging status
      await supabase.from('import_staging').update({ mapping_status: 'NORMALIZED' }).eq('id', batchId);

      toast({ title: 'Success', description: `${validLeads.length} records successfully mapped and normalized.` });
      
      // We process them immediately
      toast({ title: 'Processing', description: `Running classification and scoring...` });
      await DeduplicationEngine.processAllPendingLeads();
      
      onComplete();

    } catch (err: any) {
      toast({ title: 'Mapping Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <Card className="bg-card/40 border-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-400" /> Dynamic Field Mapping
        </CardTitle>
        <CardDescription>
          We analyzed your CSV. Please confirm or override the suggested field mappings below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="rounded-md border border-white/10 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">CSV Column Header</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Map To Database Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(batch?.raw_headers || []).map((header: string, idx: number) => {
                const isIgnored = mappings[header] === 'IGNORE';
                const confidence = isIgnored ? 0 : 95; // Simplified confidence display

                return (
                  <tr key={idx} className="bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-foreground">{header}</td>
                    <td className="px-4 py-3">
                      {isIgnored ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="text-emerald-400">{confidence}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={mappings[header] || 'IGNORE'} 
                        onValueChange={(val) => setMappings({ ...mappings, [header]: val })}
                      >
                        <SelectTrigger className="w-[200px] h-8 bg-white/5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIVERSAL_FIELDS.map(f => (
                            <SelectItem key={f} value={f}>
                              {f === 'IGNORE' ? '-- Do not import --' : f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button onClick={handleConfirmMapping} disabled={processing} className="w-full">
          {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Confirm Mapping & Run Normalization
        </Button>
      </CardContent>
    </Card>
  );
}
