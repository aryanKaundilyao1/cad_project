import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileText } from 'lucide-react';
import AdminImportMapper from './AdminImportMapper';

export default function AdminLeadUpload() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!csvData.trim()) {
      toast({ title: 'No Data', description: 'Please paste CSV data first.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Basic CSV parser
      const rows = csvData.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error("Need at least a header row and one data row.");

      // Detect delimiter by looking at a sample of the text
      let delimiter = ',';
      if (csvData.includes('\\t')) delimiter = '\\t';
      else if (csvData.includes(';')) delimiter = ';';
      else if (csvData.includes('|')) delimiter = '|';
      
      let headerRowIndex = 0;
      let headers: string[] = [];

      // Find the first row that looks like a header (has multiple columns)
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const potentialHeaders = rows[i].split(delimiter).map(h => h.trim()).filter(h => h);
        if (potentialHeaders.length > 1) {
          headerRowIndex = i;
          headers = rows[i].split(delimiter).map(h => h.trim());
          break;
        }
      }

      // If we couldn't find a row with multiple columns, fallback to first row
      if (headers.length === 0) {
        headers = rows[0].split(delimiter).map(h => h.trim());
      }

      const rawRows = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const columns = rows[i].split(delimiter).map(c => c.trim());
        rawRows.push(columns);
      }

      // Phase 1: Insert to import_staging
      const { data, error } = await supabase.from('import_staging').insert([{
        file_name: 'Manual CSV Paste',
        raw_headers: headers,
        raw_row_data: rawRows,
        mapping_status: 'PENDING'
      }]).select().single();

      if (error) throw error;

      toast({ title: 'Upload Successful', description: `Moving to Column Mapping.` });
      setCsvData('');
      setActiveBatchId(data.id);
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (activeBatchId) {
    return <AdminImportMapper batchId={activeBatchId} onComplete={() => setActiveBatchId(null)} />;
  }

  return (
    <Card className="bg-card/40 border-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-400" /> Flexible Lead Upload
        </CardTitle>
        <CardDescription>
          Paste any CSV data below. You will map the columns in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea 
          placeholder="Paste CSV here (with headers)..." 
          className="min-h-[250px] bg-white/5 border-white/10 font-mono text-sm"
          value={csvData}
          onChange={e => setCsvData(e.target.value)}
        />

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !csvData.trim()}
          className="w-full sm:w-auto"
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Upload & Map Columns
        </Button>
      </CardContent>
    </Card>
  );
}
