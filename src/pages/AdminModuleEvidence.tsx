import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Activity, Database, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function AdminModuleEvidence() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [id, profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (leadError) throw leadError;
      setLead(leadData);

      const { data: modData, error: modError } = await supabase
        .from('lead_modules')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      if (modError && modError.code !== '42P01') console.error(modError); // Ignore if table missing in dev
      else setModules(modData || []);

      const { data: histData, error: histError } = await supabase
        .from('lead_score_history')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      if (histError && histError.code !== '42P01') console.error(histError);
      else setHistory(histData || []);

    } catch (err: any) {
      toast({ title: "Error fetching evidence", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center">Loading Evidence...</div>;
  if (!lead) return <div className="p-10 flex justify-center">Lead Not Found</div>;

  const EXPECTED_MODULES = ['Website', 'LinkedIn', 'Marketplace', 'Procurement', 'Tender', 'Import Export', 'Government', 'Certificates'];
  const activeModuleTypes = Array.from(new Set(modules.map(m => m.module_type)));
  const missingModules = EXPECTED_MODULES.filter(m => !activeModuleTypes.includes(m));
  const completeness = Math.round((activeModuleTypes.length / EXPECTED_MODULES.length) * 100);
  const nextBestResearch = missingModules.length > 0 ? missingModules[0] : null;

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Intelligence Center
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-400" /> Lead Module Registry
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-2">
            <Building className="h-4 w-4" /> {lead.company_name || lead.title}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1">ID: {lead.id}</p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-lg py-1 px-4 border-blue-500/20 mb-2 block">
            Live Score: {lead.current_score || history[0]?.score || 0}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">Confidence: <span className="text-white">{lead.current_confidence || 'Unknown'}</span></p>
          <p className="text-xs text-muted-foreground">Updated: {history[0] ? new Date(history[0].created_at).toLocaleString() : 'Never'}</p>
        </div>
      </div>

      {/* Research Completeness */}
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Search className="h-5 w-5 text-purple-400" /> Research Completeness</h3>
              <p className="text-sm text-muted-foreground">Progress towards a fully qualified opportunity profile.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{completeness}%</span>
              <p className="text-xs text-muted-foreground">{activeModuleTypes.length} of {EXPECTED_MODULES.length} modules</p>
            </div>
          </div>
          <Progress value={completeness} className="h-2 mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXPECTED_MODULES.map(mod => {
              const isActive = activeModuleTypes.includes(mod);
              return (
                <div key={mod} className={`p-2 rounded-md border text-sm flex items-center gap-2 ${isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                  {isActive ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-current opacity-50" />}
                  {mod}
                </div>
              );
            })}
          </div>

          {nextBestResearch && (
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-purple-400 font-semibold uppercase mb-1">Next Best Research</p>
                <p className="text-sm text-white">Focus on acquiring <span className="font-semibold text-purple-300">{nextBestResearch}</span> data next to improve confidence.</p>
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Initiate Search</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="text-emerald-400 h-5 w-5"/> Registered Modules</CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No modules registered yet.</p>
            ) : (
              <div className="space-y-4">
                {modules.map(mod => (
                  <div key={mod.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-300">{mod.module_type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(mod.created_at).toLocaleDateString()}</span>
                    </div>
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(mod.evidence, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="text-yellow-400 h-5 w-5"/> Score Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No score history available.</p>
            ) : (
              <div className="space-y-4">
                {history.map(hist => (
                  <div key={hist.id} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex-shrink-0 text-2xl font-bold text-white w-12 text-center">
                      {hist.score}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Trigger: <span className="text-white">{hist.module_trigger}</span></p>
                      {hist.reason_codes && hist.reason_codes.map((reason: string, i: number) => (
                        <p key={i} className={`text-xs ${reason.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                          {reason}
                        </p>
                      ))}
                      <p className="text-[10px] text-muted-foreground mt-2">{new Date(hist.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
