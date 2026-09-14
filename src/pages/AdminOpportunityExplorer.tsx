import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminOpportunityExplorer() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'rules' | 'candidates'>('rules');
  const [rules, setRules] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    if (activeTab === 'rules') {
      const { data } = await supabase.from('opportunity_generation_rules').select('*').order('signal_type');
      setRules(data || []);
    } else {
      const { data } = await supabase.from('opportunity_candidates')
        .select('*, company:jas_companies(company_name)')
        .order('generated_at', { ascending: false })
        .limit(50);
      setCandidates(data || []);
    }
    setIsLoading(false);
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('opportunity_generation_rules')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    if (!error) {
      toast({ title: "Rule Updated", description: "Generation rule status updated." });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-grow container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Target className="h-8 w-8 text-indigo-600" />
              Opportunity Generation Admin
            </h1>
            <p className="text-slate-500 mt-2">Manage the rules engine that automatically generates opportunity candidates from signals.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={activeTab === 'rules' ? 'default' : 'outline'} onClick={() => setActiveTab('rules')}>
              Generation Rules
            </Button>
            <Button variant={activeTab === 'candidates' ? 'default' : 'outline'} onClick={() => setActiveTab('candidates')}>
              Generation Logs
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-12 w-12 animate-spin text-slate-400" /></div>
        ) : activeTab === 'rules' ? (
          <Card>
            <CardHeader>
              <CardTitle>Active Generation Rules</CardTitle>
              <CardDescription>Determine which signals automatically trigger the creation of an Opportunity Candidate.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signal Type</TableHead>
                    <TableHead>Minimum Confidence required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium text-slate-900">{rule.signal_type}</TableCell>
                      <TableCell className="text-slate-600 font-mono">{rule.min_confidence}%</TableCell>
                      <TableCell>
                        {rule.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            Disabled
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => toggleRule(rule.id, rule.is_active)}>
                          {rule.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Generation Logs (Recent Candidates)</CardTitle>
              <CardDescription>Audit log of recently generated candidates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((cand) => (
                    <TableRow key={cand.id}>
                      <TableCell className="text-slate-500 text-sm">{new Date(cand.generated_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{cand.company?.company_name || 'Unknown'}</TableCell>
                      <TableCell className="text-slate-700">{cand.signal_type}</TableCell>
                      <TableCell className="font-mono text-slate-600">{cand.confidence}%</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {cand.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {candidates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">No candidates generated yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
