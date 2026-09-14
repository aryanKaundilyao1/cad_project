import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Activity, ServerCrash, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminProviderHealth = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      // Fetch latest logs
      const { data: logData, error: logErr } = await supabase
        .from('provider_sync_logs')
        .select('*, signal_providers(name)')
        .order('started_at', { ascending: false })
        .limit(50);
        
      if (logErr) throw logErr;
      setLogs(logData || []);

      // Fetch providers for high level stats
      const { data: providerData, error: pErr } = await supabase
        .from('signal_providers')
        .select('*');
        
      if (pErr) throw pErr;
      setProviders(providerData || []);

    } catch (err: any) {
      toast({ title: "Error loading health data", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = providers.map(p => ({
    name: p.name,
    processed: logs.filter(l => l.provider_id === p.id).reduce((sum, l) => sum + (l.records_processed || 0), 0),
    failed: logs.filter(l => l.provider_id === p.id).reduce((sum, l) => sum + (l.records_failed || 0), 0)
  }));

  const totalErrors = providers.reduce((sum, p) => sum + (p.error_count || 0), 0);
  const healthyCount = providers.filter(p => p.health_status === 'healthy').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            Provider Health Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Monitor sync status, success rates, and API errors across all providers.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600"><CheckCircle2 className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Healthy Providers</p>
                <h3 className="text-2xl font-bold">{healthyCount} / {providers.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg text-red-600"><ServerCrash className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total API Errors</p>
                <h3 className="text-2xl font-bold">{totalErrors}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600"><AlertTriangle className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Failed Records (Recent)</p>
                <h3 className="text-2xl font-bold">
                  {logs.reduce((sum, l) => sum + (l.records_failed || 0), 0)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Volume & Failures by Provider</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="processed" stackId="a" fill="#10b981" name="Processed" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Logs</CardTitle>
              <CardDescription>Last 50 sync operations</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin"/></TableCell></TableRow>
                  ) : logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs">{log.signal_providers?.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{log.duration_ms}ms</TableCell>
                      <TableCell className="text-xs">{log.records_processed}</TableCell>
                      <TableCell className="text-xs text-red-600">{log.records_failed > 0 ? log.records_failed : '-'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{new Date(log.started_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProviderHealth;
