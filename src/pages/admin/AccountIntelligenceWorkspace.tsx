import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Brain, History, Activity, MessageSquare, Target, 
  Plus, CheckCircle, Clock, Zap, Settings, Search, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AccountIntelligenceWorkspace() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [researchLogs, setResearchLogs] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [outreach, setOutreach] = useState<any[]>([]);
  const [nextActions, setNextActions] = useState<any[]>([]);
  
  // AI Message Gen State
  const [generating, setGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Email');

  useEffect(() => {
    if (leadId) fetchWorkspaceData();
  }, [leadId]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lead (Company) Data
      const { data: leadData } = await supabase.from('leads').select('*').eq('id', leadId).single();
      setLead(leadData);

      // 2. Fetch Intelligence Profile
      let { data: profData } = await supabase.from('account_intelligence_profiles').select('*').eq('lead_id', leadId).single();
      
      // If it doesn't exist, we trigger creation via RPC or fallback insert (in case trigger missed)
      if (!profData) {
        const { data: newProf } = await supabase.from('account_intelligence_profiles')
          .insert({ lead_id: leadId })
          .select().single();
        profData = newProf;
      }
      setProfile(profData);

      // 3. Fetch Related Entities
      const [sigRes, resRes, intRes, outRes, actRes] = await Promise.all([
        supabase.from('account_buying_signals').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('account_research_logs').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('account_relationship_timeline').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('account_outreach_history').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('account_next_actions').select('*').eq('lead_id', leadId).order('priority', { ascending: false })
      ]);

      setSignals(sigRes.data || []);
      setResearchLogs(resRes.data || []);
      setInteractions(intRes.data || []);
      setOutreach(outRes.data || []);
      setNextActions(actRes.data || []);

    } catch (err) {
      console.error(err);
      toast({ title: "Error loading workspace", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleGenerateMessage = () => {
    setGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const draft = `Subject: Exploring opportunities with ${lead?.company_name}

Hi ${lead?.contact_name || 'Team'},

I noticed your recent activities regarding ${lead?.industry || 'your sector'} and wanted to reach out. Based on our research, particularly your strong ${signals[0]?.signal_name || 'market presence'}, there might be a synergy with what we offer at JAS CONNECT.

Would you be open to a brief chat next week?

Best,
The JAS CONNECT Team`;
      setAiDraft(draft);
      setGenerating(false);
    }, 1500);
  };

  const handleSendOutreach = async () => {
    try {
      await supabase.from('account_outreach_history').insert({
        lead_id: leadId,
        channel: selectedChannel,
        template_used: 'AI_Contextual_Draft',
        generated_message: aiDraft,
        final_message: aiDraft,
      });

      await supabase.from('account_relationship_timeline').insert({
        lead_id: leadId,
        interaction_type: `${selectedChannel} Sent`,
        status: 'Completed'
      });

      toast({ title: "Message Logged Successfully" });
      setAiDraft('');
      fetchWorkspaceData();
    } catch (e) {
      toast({ title: "Failed to log message", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Intelligence Workspace...</div>;
  if (!lead) return <div className="p-12 text-center text-destructive">Account not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.company_name}</h1>
              <Badge variant={profile?.relationship_health === 'Positive' ? 'default' : 'secondary'}>
                {profile?.relationship_health || 'Unknown Health'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
              <span>{lead.industry || 'Unknown Industry'} • {lead.country || 'Unknown Location'}</span>
              <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary"/> AI Score: {lead.quality_score}/100</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
          <Button><Plus className="h-4 w-4 mr-2" /> Log Interaction</Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="intelligence" className="h-full flex flex-col">
          <div className="bg-white px-6 border-b">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="intelligence" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"><Brain className="h-4 w-4 mr-2"/> Intelligence</TabsTrigger>
              <TabsTrigger value="research" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"><Search className="h-4 w-4 mr-2"/> Research Log</TabsTrigger>
              <TabsTrigger value="signals" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"><Zap className="h-4 w-4 mr-2"/> Buying Signals</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"><Activity className="h-4 w-4 mr-2"/> Relationship Timeline</TabsTrigger>
              <TabsTrigger value="outreach" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"><MessageSquare className="h-4 w-4 mr-2"/> Outreach & Actions</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            
            {/* 1. INTELLIGENCE DATA */}
            <TabsContent value="intelligence" className="m-0 h-full">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle>Structured Intelligence</CardTitle>
                      <CardDescription>Modular, industry-agnostic data points.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm"><Edit3 className="h-4 w-4 mr-2"/> Edit</Button>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(profile?.intelligence_data || {}).length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                        No structured intelligence data logged yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(profile?.intelligence_data || {}).map(([k, v]) => (
                          <div key={k} className="bg-slate-50 p-3 rounded border">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.replace(/_/g, ' ')}</div>
                            <div className="font-medium mt-1">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 border rounded-lg bg-slate-50">
                      <div className="font-semibold">{lead.contact_name || 'No Primary Contact'}</div>
                      <div className="text-sm text-muted-foreground">{lead.email || 'No Email'}</div>
                      <div className="text-sm text-muted-foreground">{lead.phone || 'No Phone'}</div>
                    </div>
                    <Button variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2"/> Add Contact</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 2. RESEARCH LOG */}
            <TabsContent value="research" className="m-0">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>Chronological Research</CardTitle>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Log Finding</Button>
                </CardHeader>
                <CardContent>
                  {researchLogs.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                      No research logged. Start investigating this account.
                    </div>
                  ) : (
                    <div className="space-y-4 border-l-2 border-slate-200 ml-4 pl-4">
                      {researchLogs.map(log => (
                        <div key={log.id} className="relative">
                          <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                          <div className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                          <div className="font-semibold">{log.event_type}</div>
                          <div className="text-slate-700 mt-1">{log.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. BUYING SIGNALS */}
            <TabsContent value="signals" className="m-0">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>Active Buying Signals</CardTitle>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Add Signal</Button>
                </CardHeader>
                <CardContent>
                  {signals.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                      No buying signals detected yet.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {signals.map(sig => (
                        <div key={sig.id} className="flex items-start justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={sig.status === 'Positive' ? 'default' : sig.status === 'Negative' ? 'destructive' : 'secondary'}>
                                {sig.status}
                              </Badge>
                              <span className="font-semibold text-lg">{sig.signal_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">{sig.category} • Source: {sig.source || 'Manual'}</div>
                            <p className="text-slate-700">{sig.description}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>Reliability: {sig.reliability_score}%</div>
                            <div>Freshness: {sig.freshness_score}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. RELATIONSHIP TIMELINE */}
            <TabsContent value="timeline" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Relationship Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  {interactions.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                      No interactions recorded.
                    </div>
                  ) : (
                    <div className="space-y-6 border-l-2 border-slate-200 ml-4 pl-6 py-2">
                      {interactions.map(int => (
                        <div key={int.id} className="relative">
                          <div className="absolute -left-8 mt-1 h-4 w-4 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{int.interaction_type}</div>
                              <div className="text-sm text-muted-foreground">Status: {int.status}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(int.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. OUTREACH & NEXT ACTIONS */}
            <TabsContent value="outreach" className="m-0">
              <div className="grid grid-cols-2 gap-6 h-full">
                
                {/* Left: Next Best Actions */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary"/> AI Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {nextActions.length === 0 ? (
                        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                          AI is analyzing the workspace for next best actions...
                        </div>
                      ) : (
                        nextActions.map(action => (
                          <div key={action.id} className="p-4 border rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-blue-900">{action.recommended_action}</span>
                              <Badge variant={action.priority === 'High' ? 'destructive' : 'secondary'}>{action.priority}</Badge>
                            </div>
                            <p className="text-sm text-blue-800/80 mb-2">{action.reason}</p>
                            <div className="text-xs text-blue-600 font-medium">AI Confidence: {action.confidence_score}%</div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Outreach History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        {outreach.length === 0 ? (
                           <div className="text-center text-muted-foreground py-8">No outreach attempts yet.</div>
                        ) : (
                          <div className="space-y-4">
                            {outreach.map(o => (
                              <div key={o.id} className="p-3 border rounded text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="font-semibold">{o.channel}</span>
                                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-slate-600 line-clamp-2">{o.final_message}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Message Generator */}
                <Card className="flex flex-col h-full border-primary/20 shadow-md">
                  <CardHeader className="bg-primary/5 pb-4 border-b">
                    <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary"/> AI Contextual Message Generator</CardTitle>
                    <CardDescription>Draft highly personalized outreach based strictly on the workspace intelligence (signals, research, and history).</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-4">
                    <div className="flex gap-2 mb-4">
                      {['Email', 'LinkedIn', 'WhatsApp'].map(channel => (
                        <Button 
                          key={channel} 
                          variant={selectedChannel === channel ? 'default' : 'outline'}
                          onClick={() => setSelectedChannel(channel)}
                          size="sm"
                        >
                          {channel}
                        </Button>
                      ))}
                    </div>
                    
                    <Textarea 
                      className="flex-1 min-h-[300px] mb-4 font-mono text-sm resize-none"
                      placeholder="AI will generate draft here..."
                      value={aiDraft}
                      onChange={(e) => setAiDraft(e.target.value)}
                    />
                    
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1" onClick={handleGenerateMessage} disabled={generating}>
                        {generating ? 'AI is drafting...' : 'Generate Contextual Draft'}
                      </Button>
                      <Button className="flex-1" disabled={!aiDraft} onClick={handleSendOutreach}>
                        Send via {selectedChannel} & Log
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
