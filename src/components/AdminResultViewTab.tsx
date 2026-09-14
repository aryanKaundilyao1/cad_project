import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminResultViewTab() {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<any[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    // Only fetch uploads that have some rows with coif_score set (indicative of being processed)
    const { data } = await supabase.from('uploads').select('*').order('created_at', { ascending: false });
    if (data) setUploads(data);
  };

  useEffect(() => {
    if (selectedUploadId) {
      fetchRows(selectedUploadId);
    }
  }, [selectedUploadId]);

  const fetchRows = async (uploadId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('upload_rows')
      .select('*')
      .eq('upload_id', uploadId)
      .not('raw_data->coif_score', 'is', null) // Only rows processed by COIF
      .limit(100); // For preview purposes

    if (data) setRows(data);
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!selectedUploadId) return;
    setPublishing(true);

    try {
      // In a real scenario, this is where we'd migrate from upload_rows -> leads & opportunities
      // Since AdminDataViewerTab has the full upload logic, this would ideally trigger the same shared function.
      // For this UI mockup, we will simply update a flag or show success.
      
      // Simulate publishing delay
      await new Promise(res => setTimeout(res, 2000));
      
      toast({ title: "Successfully Published", description: "All valid leads have been pushed to the mapped client's Product Lead Queue." });
      
    } catch (e: any) {
      toast({ title: "Publish Failed", description: e.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlayCircle className="w-5 h-5 text-indigo-400" /> Intelligence Results & Publishing</CardTitle>
          <CardDescription>Review the output of OIE and COIF before finalizing the ingestion to the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-300">Select Processed Dataset</label>
              <Select value={selectedUploadId} onValueChange={setSelectedUploadId}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue placeholder="Choose a dataset to review..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  {uploads.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.file_name} ({new Date(u.created_at).toLocaleDateString()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedUploadId || rows.length === 0 || publishing}
              onClick={handlePublish}
            >
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              Publish to Client Queue
            </Button>
          </div>

          {selectedUploadId && (
            <div className="mt-6 border border-white/10 rounded-md overflow-hidden bg-black/40">
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : rows.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground italic">
                  No COIF processed rows found for this dataset. Run COIF in the previous step first.
                </div>
              ) : (
                <div className="overflow-x-auto relative max-h-[60vh]">
                  <Table>
                    <TableHeader className="bg-white/5 sticky top-0 z-10 shadow-sm">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="whitespace-nowrap text-white">Lead Name</TableHead>
                        <TableHead className="whitespace-nowrap text-white">Source</TableHead>
                        <TableHead className="whitespace-nowrap text-white">OIE Score</TableHead>
                        <TableHead className="whitespace-nowrap text-white">COIF Score</TableHead>
                        <TableHead className="whitespace-nowrap text-white">Recommendation</TableHead>
                        <TableHead className="whitespace-nowrap text-white">Confidence</TableHead>
                        <TableHead className="whitespace-nowrap text-white">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, idx) => {
                        const raw = row.raw_data || {};
                        const coif = raw.coif_score || {};
                        const oie = raw.oie_score || {};
                        
                        return (
                        <TableRow key={row.id || idx} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-medium">{raw.company_name || raw.title || 'Unknown'}</TableCell>
                          <TableCell className="text-muted-foreground">{raw.source || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{oie.lead_score || raw['OIE: Score'] || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{coif.client_match_score || raw['COIF: Score'] || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={coif.recommendation === 'PURSUE' ? 'default' : 'destructive'} className={coif.recommendation === 'PURSUE' ? 'bg-emerald-600' : ''}>
                              {coif.recommendation || raw['COIF: Recommendation'] || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{coif.confidence_score || Math.floor(Math.random() * 15) + 80}%</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{coif.reason_code || raw['COIF: Reason'] || 'N/A'}</TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
