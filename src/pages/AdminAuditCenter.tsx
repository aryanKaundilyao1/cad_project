import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList, ArrowRight } from "lucide-react";

const AdminAuditCenter = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunity_audit_log')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error && error.code !== '42P01') throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-teal-600" />
            Master Score Audit Trail
          </h1>
          <p className="text-gray-500 mt-2">Immutable log of every score calculation and component change.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-teal-600"/></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Scoring Events (Last 100)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Old Score</TableHead>
                      <TableHead></TableHead>
                      <TableHead>New Score</TableHead>
                      <TableHead>Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const oldS = log.old_score?.final_score || 0;
                      const newS = log.new_score?.final_score || 0;
                      const delta = Math.round((newS - oldS) * 10) / 10;
                      
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium text-indigo-600">
                            {log.companies?.name || log.company_id.substring(0,8)+'...'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="bg-gray-100 px-2 py-1 rounded">{log.trigger_event}</span>
                          </TableCell>
                          <TableCell>{oldS}</TableCell>
                          <TableCell><ArrowRight className="h-4 w-4 text-gray-400"/></TableCell>
                          <TableCell className="font-bold">{newS}</TableCell>
                          <TableCell>
                            {delta > 0 ? <span className="text-green-600">+{delta}</span> : 
                             delta < 0 ? <span className="text-red-600">{delta}</span> : 
                             <span className="text-gray-400">0</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {logs.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No audit logs found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminAuditCenter;
