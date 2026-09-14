import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Network, CheckCircle2 } from 'lucide-react';

interface MappingProps {
  datasetId: string;
  onClose: () => void;
}

export default function AdminSemanticMapping({ datasetId, onClose }: MappingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [semanticFields, setSemanticFields] = useState<any[]>([]);
  
  // source_id -> array of headers
  const [sourceHeaders, setSourceHeaders] = useState<Record<string, { sourceName: string, headers: string[] }>>({});
  
  // mapping state: source_id -> { header -> semantic_field }
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    loadData();
  }, [datasetId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Field Dictionary
      const { data: dictData } = await supabase.from('field_dictionary').select('semantic_field');
      setSemanticFields(dictData || []);

      // 2. Load headers from dataset_records
      const { data: recordsData } = await supabase
        .from('dataset_records')
        .select('source_id, source_name, raw_data')
        .eq('dataset_id', datasetId);

      const headersMap: Record<string, { sourceName: string, headers: Set<string> }> = {};

      recordsData?.forEach(record => {
        const sid = record.source_id;
        if (!sid) return;

        if (!headersMap[sid]) {
          headersMap[sid] = { sourceName: record.source_name || 'Unknown', headers: new Set() };
        }
        
        const raw = typeof record.raw_data === 'string' ? JSON.parse(record.raw_data) : record.raw_data;
        Object.keys(raw).forEach(k => headersMap[sid].headers.add(k));
      });

      const parsedHeadersMap: Record<string, { sourceName: string, headers: string[] }> = {};
      Object.keys(headersMap).forEach(k => {
        parsedHeadersMap[k] = {
          sourceName: headersMap[k].sourceName,
          headers: Array.from(headersMap[k].headers)
        };
      });

      setSourceHeaders(parsedHeadersMap);

      // 3. Load existing mappings
      const sourceIds = Object.keys(parsedHeadersMap);
      if (sourceIds.length > 0) {
        const { data: existingMappings } = await supabase
          .from('field_mappings')
          .select('*')
          .in('source_id', sourceIds);

        const loadedMappings: Record<string, Record<string, string>> = {};
        existingMappings?.forEach(m => {
          if (!loadedMappings[m.source_id]) loadedMappings[m.source_id] = {};
          loadedMappings[m.source_id][m.original_header] = m.semantic_field;
        });

        setMappings(loadedMappings);
      }

    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load mapping data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (sourceId: string, header: string, value: string) => {
    setMappings(prev => ({
      ...prev,
      [sourceId]: {
        ...(prev[sourceId] || {}),
        [header]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const inserts = [];
      for (const sourceId of Object.keys(mappings)) {
        for (const header of Object.keys(mappings[sourceId])) {
          const semanticField = mappings[sourceId][header];
          if (semanticField && semanticField !== 'none') {
            inserts.push({
              source_id: sourceId,
              original_header: header,
              semantic_field: semanticField
            });
          }
        }
      }

      if (inserts.length > 0) {
        // Upsert mappings
        const { error } = await supabase.from('field_mappings').upsert(inserts, {
          onConflict: 'source_id, original_header'
        });
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Mappings saved successfully' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error saving mappings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-black/60 border-white/10 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-300">
          <Network className="w-5 h-5" /> Semantic Mapping
        </CardTitle>
        <CardDescription>
          Map raw CSV headers to unified JAS Semantic Fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {Object.entries(sourceHeaders).map(([sourceId, { sourceName, headers }]) => (
          <div key={sourceId} className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/5">
            <h4 className="font-semibold text-lg">{sourceName} Mappings</h4>
            <div className="border border-white/10 rounded overflow-hidden">
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Original Header</TableHead>
                    <TableHead className="text-white">Semantic Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map(header => (
                    <TableRow key={header} className="border-white/5">
                      <TableCell className="font-mono text-xs text-muted-foreground">{header}</TableCell>
                      <TableCell>
                        <Select 
                          value={mappings[sourceId]?.[header] || ''}
                          onValueChange={(v) => handleMappingChange(sourceId, header, v)}
                        >
                          <SelectTrigger className="bg-black/50 border-white/10">
                            <SelectValue placeholder="Map field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Ignore (Save as Custom Attribute) --</SelectItem>
                            {semanticFields.map(f => (
                              <SelectItem key={f.semantic_field} value={f.semantic_field}>
                                {f.semantic_field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        <div className="flex gap-4 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="bg-transparent border-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Mappings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
