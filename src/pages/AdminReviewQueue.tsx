import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileSearch, Check, X, Building2 } from "lucide-react";
import { EntityReviewEngine } from "@/services/intelligence/entity/EntityReviewEngine";

const AdminReviewQueue = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // To avoid massive DB queries inside render, we will fetch candidate names
  const [candidateNames, setCandidateNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('entity_review_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setQueue(data || []);

      // Fetch candidate names for rendering
      if (data && data.length > 0) {
        const ids = data.flatMap(q => q.candidate_company_ids || []);
        if (ids.length > 0) {
          const { data: companies } = await supabase.from('companies').select('id, name').in('id', ids);
          if (companies) {
            const nameMap: Record<string, string> = {};
            companies.forEach(c => { nameMap[c.id] = c.name });
            setCandidateNames(nameMap);
          }
        }
      }

    } catch (err: any) {
      toast({ title: "Error loading queue", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (queueId: string, action: 'approve' | 'reject', targetCompanyId?: string) => {
    try {
      setIsProcessing(queueId);
      await EntityReviewEngine.resolveQueueItem(queueId, action, targetCompanyId);
      toast({ title: `Successfully ${action}d match` });
      setQueue(queue.filter(q => q.id !== queueId));
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSearch className="h-8 w-8 text-indigo-600" />
            Entity Review Queue
          </h1>
          <p className="text-gray-500 mt-2">Manually resolve uncertain company matches.</p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incoming Entity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Reasons</TableHead>
                  <TableHead>Top Candidate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                ) : queue.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">No pending reviews in the queue.</TableCell></TableRow>
                ) : (
                  queue.map(item => {
                    // Just take the top candidate for simplicity in this UI
                    const topCandidateId = item.candidate_company_ids?.[0];
                    const topCandidateName = topCandidateId ? candidateNames[topCandidateId] : 'Unknown';

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-bold">{item.incoming_payload?.companyName || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-lg font-bold text-yellow-600">{item.confidence_score}%</div>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-xs text-gray-600">
                            {item.matching_reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </TableCell>
                        <TableCell>
                          {topCandidateId ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{topCandidateName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={!!isProcessing}
                              onClick={() => handleAction(item.id, 'reject')}
                            >
                              {isProcessing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />} Keep Separate
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={!!isProcessing || !topCandidateId}
                              onClick={() => handleAction(item.id, 'approve', topCandidateId)}
                            >
                              {isProcessing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Merge
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReviewQueue;
