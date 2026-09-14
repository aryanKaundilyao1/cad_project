import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, History, FileText, ChevronRight, PieChart, Network, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AdminSemanticMapping from './AdminSemanticMapping';

export default function AdminIndustryDatasets() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
  
  const { toast } = useToast();
  const [sources, setSources] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [showMapping, setShowMapping] = useState(false);
  const [normalizing, setNormalizing] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('industry_datasets')
        .select(`
          id,
          dataset_name,
          record_count,
          source_count,
          status,
          updated_at,
          industry_id,
          industries ( name )
        `)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setDatasets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetDetails = async (dataset: any) => {
    setSelectedDataset(dataset);
    setShowMapping(false);
    setDetailsLoading(true);
    try {
      // Fetch Source Breakdown
      // Group by source_id, join with sources table to get name
      const { data: srcData, error: srcErr } = await supabase
        .from('dataset_sources')
        .select(`
          source_id,
          record_count,
          sources ( name )
        `)
        .eq('dataset_id', dataset.id);

      if (srcErr) throw srcErr;
      
      const sourceBreakdown: Record<string, { name: string; count: number }> = {};
      srcData?.forEach((row: any) => {
        const sName = row.sources?.name || 'Unknown Source';
        if (!sourceBreakdown[sName]) {
          sourceBreakdown[sName] = { name: sName, count: 0 };
        }
        sourceBreakdown[sName].count += (row.record_count || 0);
      });
      
      setSources(Object.values(sourceBreakdown));

      // Fetch Upload History
      const { data: histData, error: histErr } = await supabase
        .from('dataset_sources')
        .select(`
          id,
          file_name,
          record_count,
          created_at,
          sources ( name ),
          uploads ( status )
        `)
        .eq('dataset_id', dataset.id)
        .order('created_at', { ascending: false });
        
      if (histErr) throw histErr;
      
      setHistory(histData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleNormalize = async () => {
    if (!selectedDataset) return;
    setNormalizing(true);
    try {
      const { runSemanticNormalization } = await import('@/lib/semanticNormalizationEngine');
      const stats = await runSemanticNormalization({
        datasetId: selectedDataset.id
      });
      
      if (stats) {
        toast({
          title: 'Normalization Complete',
          description: `Normalized ${stats.normalizedRecordsCount} entities from ${stats.totalRecords} records.`
        });
      } else {
        toast({ title: 'No Data', description: 'No records found to normalize.' });
      }
    } catch (err: any) {
      toast({ title: 'Normalization Failed', description: err.message, variant: 'destructive' });
    } finally {
      setNormalizing(false);
    }
  };

  if (loading && datasets.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" /> 
            Industry Datasets
          </h2>
          <p className="text-muted-foreground mt-1">
            Consolidated data pools categorized by industry.
          </p>
        </div>
        <Button onClick={fetchDatasets} variant="outline" className="bg-white/5">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dataset List */}
        <div className="lg:col-span-5 space-y-4">
          {datasets.map(dataset => (
            <Card 
              key={dataset.id} 
              className={`border-white/10 cursor-pointer transition-all hover:bg-white/5 ${selectedDataset?.id === dataset.id ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black/40'}`}
              onClick={() => loadDatasetDetails(dataset)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{dataset.dataset_name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> {dataset.record_count.toLocaleString()} Records
                    </span>
                    <span className="flex items-center gap-1">
                      <PieChart className="w-4 h-4" /> {dataset.source_count} Uploads
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
              </CardContent>
            </Card>
          ))}
          {datasets.length === 0 && !loading && (
            <div className="text-center p-8 text-muted-foreground border border-white/10 rounded-lg bg-black/20">
              No datasets created yet. Upload files to generate datasets.
            </div>
          )}
        </div>

        {/* Right Column: Dataset Details */}
        <div className="lg:col-span-7">
          {selectedDataset ? (
            <div className="space-y-6">
              <Card className="border-white/10 bg-black/40">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{selectedDataset.dataset_name}</CardTitle>
                    <CardDescription>
                      Last updated on {new Date(selectedDataset.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowMapping(!showMapping)}
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <Network className="w-4 h-4 mr-2" /> Mappings
                    </Button>
                    <Button 
                      onClick={handleNormalize}
                      disabled={normalizing}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {normalizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                      Normalize
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showMapping ? (
                    <AdminSemanticMapping 
                      datasetId={selectedDataset.id} 
                      onClose={() => setShowMapping(false)} 
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <div className="text-3xl font-bold text-blue-400">{selectedDataset.record_count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">Total Records</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <div className="text-3xl font-bold text-emerald-400">{selectedDataset.source_count}</div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">Total Sources (Uploads)</div>
                    </div>
                  </div>

                  {detailsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-indigo-300">
                        <PieChart className="w-4 h-4" /> Source Breakdown
                      </h4>
                      <div className="space-y-2 mb-8">
                        {sources.map(src => (
                          <div key={src.name} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                            <span className="font-medium">{src.name}</span>
                            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                              {src.count.toLocaleString()} records
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-300">
                        <History className="w-4 h-4" /> Upload History
                      </h4>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10">
                              <TableHead>File Name</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Records</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {history.map(item => (
                              <TableRow key={item.id} className="border-white/5">
                                <TableCell className="font-medium text-xs truncate max-w-[150px]" title={item.file_name}>
                                  {item.file_name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {item.sources?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs bg-black/40">
                                    +{item.record_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            {history.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No uploads found.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                  </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-white/10 bg-black/20 h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select a dataset to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
