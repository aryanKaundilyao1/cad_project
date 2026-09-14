import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

export default function ImportEngine() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [moduleType, setModuleType] = useState('GoogleMaps');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      // IN A REAL SCENARIO: Parse CSV/Excel here. 
      // For this architecture demo, we simulate the import logic.
      await new Promise(r => setTimeout(r, 2000));
      
      // Simulate resolving companies via RPC
      // const { data, error } = await supabase.rpc('match_company', { domain, name, etc })
      
      setResults({
        totalRows: 150,
        exactMatches: 85, // Attached module to existing company
        newCompanies: 65, // Created new master company + attached module
        conflicts: 0
      });
      
      toast({
        title: "Import Successful",
        description: `Processed 150 rows. 85 attached to existing companies. 65 new master companies created.`
      });
      
    } catch (e: any) {
      toast({ title: 'Import Failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Universal Import Engine</h1>
          <p className="text-muted-foreground mt-2">
            Upload raw data modules. The engine will intelligently match entities, update master companies, and trigger scoring cascades.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Source Template</CardTitle>
              <CardDescription>What kind of data are you uploading?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={moduleType}
                onChange={e => setModuleType(e.target.value)}
              >
                <option value="GoogleMaps">Google Maps Scrape</option>
                <option value="LinkedIn">LinkedIn Company Export</option>
                <option value="GovContracts">Government Contracts (Tenders)</option>
                <option value="Custom">Custom Evidence Module</option>
              </select>
              
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex items-center justify-center min-h-[120px]">
                <label className="cursor-pointer text-center">
                  <Input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-primary hover:underline">
                    {file ? file.name : "Click to select CSV/Excel file"}
                  </span>
                </label>
              </div>
              
              <Button 
                className="w-full" 
                disabled={!file || isProcessing} 
                onClick={processImport}
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing & Matching...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Start Resolution Engine</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className={results ? 'border-primary shadow-md' : 'opacity-50'}>
            <CardHeader>
              <CardTitle>Resolution Results</CardTitle>
              <CardDescription>Event cascades triggered automatically</CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mb-4 opacity-20" />
                  <p>Waiting for import...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{results.exactMatches}</p>
                      <p className="text-xs text-emerald-600/80 uppercase font-semibold mt-1">Modules Attached</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{results.newCompanies}</p>
                      <p className="text-xs text-blue-600/80 uppercase font-semibold mt-1">New Companies</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Workflow Triggered</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground ml-6 list-disc">
                      <li>Score recalculated for 150 master companies.</li>
                      <li>AI Summaries regenerated for changed entities.</li>
                      <li>Client Dashboards instantly updated with new pipeline scores.</li>
                      <li>Search indexes synced.</li>
                    </ul>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={() => navigate('/admin/entity')}>
                    View Master Companies
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
