import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Activity, Database, AlertTriangle, Layers, Percent, XCircle, Combine } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminNormalizationAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total_runs: 0,
    total_records: 0,
    normalized_records: 0,
    duplicates_found: 0,
    duplicates_merged: 0,
    unknown_fields: 0,
    validation_errors: 0,
    failed_records: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('normalization_logs')
        .select(`
          *,
          industry_datasets ( dataset_name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setLogs(data);
        
        const aggregate = data.reduce((acc, log) => {
          acc.total_runs += 1;
          acc.total_records += log.total_records || 0;
          acc.normalized_records += log.normalized_records || 0;
          acc.duplicates_found += log.duplicates_found || 0;
          acc.duplicates_merged += log.duplicates_merged || 0;
          acc.unknown_fields += log.unknown_fields || 0;
          acc.validation_errors += log.validation_errors || 0;
          acc.failed_records += log.failed_records || 0;
          return acc;
        }, {
          total_runs: 0,
          total_records: 0,
          normalized_records: 0,
          duplicates_found: 0,
          duplicates_merged: 0,
          unknown_fields: 0,
          validation_errors: 0,
          failed_records: 0,
        });

        setStats(aggregate);
      }
    } catch (err) {
      console.error("Error fetching normalization analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const successRate = stats.total_records > 0 
    ? Math.round((stats.normalized_records / stats.total_records) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-400" /> 
        Semantic Normalization Engine Analytics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Records Processed</p>
                <h4 className="text-2xl font-bold">{stats.total_records.toLocaleString()}</h4>
              </div>
              <Database className="w-5 h-5 text-blue-400 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Normalized Entities</p>
                <h4 className="text-2xl font-bold text-emerald-400">{stats.normalized_records.toLocaleString()}</h4>
              </div>
              <Layers className="w-5 h-5 text-emerald-400 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                <h4 className="text-2xl font-bold text-indigo-400">{successRate}%</h4>
              </div>
              <Percent className="w-5 h-5 text-indigo-400 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duplicates Merged</p>
                <h4 className="text-2xl font-bold text-amber-400">{stats.duplicates_merged.toLocaleString()}</h4>
              </div>
              <Combine className="w-5 h-5 text-amber-400 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unknown Fields</span>
          <span className="font-semibold">{stats.unknown_fields.toLocaleString()}</span>
        </div>
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-sm flex items-center gap-2 text-orange-400">
            <AlertTriangle className="w-4 h-4" /> Validation Errors
          </span>
          <span className="font-semibold text-orange-400">{stats.validation_errors.toLocaleString()}</span>
        </div>
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-sm flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" /> Failed Records
          </span>
          <span className="font-semibold text-red-400">{stats.failed_records.toLocaleString()}</span>
        </div>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle>Recent Normalization Runs</CardTitle>
          <CardDescription>Log history of background processing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/10">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Dataset</TableHead>
                <TableHead className="text-white text-right">Processed</TableHead>
                <TableHead className="text-white text-right">Normalized</TableHead>
                <TableHead className="text-white text-right">Merged</TableHead>
                <TableHead className="text-white text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No normalization runs yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id} className="border-white/5">
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.industry_datasets?.dataset_name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{log.total_records}</TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium">{log.normalized_records}</TableCell>
                    <TableCell className="text-right text-amber-400">{log.duplicates_merged}</TableCell>
                    <TableCell className="text-right text-red-400">
                      {(log.validation_errors + log.failed_records) > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {log.validation_errors + log.failed_records}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
