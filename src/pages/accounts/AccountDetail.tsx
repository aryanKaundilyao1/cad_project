import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Activity, Building2, MapPin, Radar, FileText, 
  Pickaxe, Eye, Users, Target, Phone, Mail, Globe, PlusCircle, CheckCircle2 
} from "lucide-react";
import { SignalTimeline } from '@/components/intelligence/SignalTimeline';
import { Signal } from '@/lib/intelligence/BaseSignalExtractor';
import { OpportunityReadinessEngine, ReadinessResult } from '@/lib/intelligence/OpportunityReadinessEngine';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Forms
  const [showAddContact, setShowAddContact] = useState(false);
  const [cName, setCName] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cDM, setCDM] = useState(false);

  useEffect(() => {
    fetchAccountData();
  }, [id]);

  const fetchAccountData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Account
      const { data: acc, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (accErr) {
        console.error("Error fetching account details:", accErr);
        toast({ title: "Account not found", variant: "destructive" });
        navigate('/accounts');
        return;
      }
      setAccount(acc);

      // 2. Fetch Related Contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', id);
      setContacts(contactsData || []);

      // 3. Fetch Related Opportunities
      const { data: oppsData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('account_id', id);
      setOpportunities(oppsData || []);

      // 4. Fetch Related Signals
      const compId = acc.legacy_company_id || acc.id;
      const { data: sigData } = await supabase
        .from('company_signals')
        .select(`
          signal_id,
          signals (*)
        `)
        .eq('company_id', compId)
        .order('created_at', { ascending: false });

      if (sigData) {
        const extractedSignals = sigData
          .map(item => item.signals)
          .filter(Boolean) as any[];
        extractedSignals.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
        setSignals(extractedSignals);

        // Evaluate Readiness using Engine
        const engine = new OpportunityReadinessEngine();
        const readiness = engine.evaluateReadiness(extractedSignals);
        setReadinessResult(readiness);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    toast({
      title: isWatchlisted ? "Removed from Watchlist" : "Added to Watchlist",
      description: `${account?.name} updates will now appear in your Intelligence feed.`
    });
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cEmail) {
      toast({ title: "Name and Email are required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          workspace_id: account.workspace_id,
          account_id: account.id,
          full_name: cName,
          job_title: cTitle,
          email: cEmail,
          phone: cPhone,
          is_decision_maker: cDM,
          created_by: account.created_by
        });

      if (error) throw error;
      toast({ title: "Contact added successfully" });
      setShowAddContact(false);
      setCName('');
      setCTitle('');
      setCEmail('');
      setCPhone('');
      setCDM(false);
      fetchAccountData();
    } catch (err: any) {
      toast({ title: "Failed to add contact", description: err.message, variant: "destructive" });
    }
  };

  const intelligenceSummary = useMemo(() => {
    const highConfidence = signals.filter(s => s.confidence_score >= 80).length;
    return {
      total: signals.length,
      highConfidence,
      lastActivity: signals.length > 0 ? new Date(signals[0].detected_at) : null
    };
  }, [signals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 pb-24 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Profile Header & Intelligence Summary */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{account?.name || 'Unknown Company'}</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                  {account?.industry && <span className="flex items-center gap-1"><Pickaxe className="w-3.5 h-3.5" /> {account.industry}</span>}
                  {account?.hq_location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {account.hq_location}</span>}
                  {account?.website && (
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">{account?.description || 'No corporate description details stored. Add signals or Enrichment outputs to update company metadata.'}</p>
            
            <div>
              <Button 
                variant={isWatchlisted ? "secondary" : "outline"} 
                size="sm" 
                onClick={handleToggleWatchlist}
                className={isWatchlisted ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : ""}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isWatchlisted ? "Watching" : "Add to Watchlist"}
              </Button>
            </div>
          </div>

          <Card className="w-full lg:w-80 shrink-0 bg-purple-500/5 border-purple-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Radar className="w-5 h-5 text-purple-400" /> Intelligence Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Signals</p>
                  <p className="text-2xl font-bold">{intelligenceSummary.total}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">High Conf.</p>
                  <p className="text-2xl font-bold text-emerald-400">{intelligenceSummary.highConfidence}</p>
                </div>
              </div>
              
              <div className="flex flex-col pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Readiness Index</span>
                  <Badge variant="outline" className={
                    readinessResult?.level === 'Critical' ? 'border-red-500/50 text-red-400' :
                    readinessResult?.level === 'High' ? 'border-purple-500/50 text-purple-400' :
                    readinessResult?.level === 'Medium' ? 'border-blue-500/50 text-blue-400' : 'text-slate-400'
                  }>
                    {readinessResult?.level || 'Low'} Readiness
                  </Badge>
                </div>
                {readinessResult?.matchedRules && readinessResult.matchedRules.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Drivers: <span className="font-medium text-foreground/70">{readinessResult.matchedRules.join(', ')}</span>
                  </p>
                )}
              </div>
              
              {intelligenceSummary.lastActivity && (
                <div className="text-[10px] text-muted-foreground text-right">
                  Last Activity: {format(intelligenceSummary.lastActivity, 'MMM d, yyyy')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 flex w-full h-12 rounded-xl overflow-x-auto justify-start mb-6">
            <TabsTrigger value="overview" className="rounded-lg px-6"><Activity className="w-4 h-4 mr-2" /> Overview & Contacts</TabsTrigger>
            <TabsTrigger value="opportunities" className="rounded-lg px-6"><Target className="w-4 h-4 mr-2" /> Linked Opportunities</TabsTrigger>
            <TabsTrigger value="signals" className="rounded-lg px-6"><Radar className="w-4 h-4 mr-2" /> Signals & Timeline</TabsTrigger>
          </TabsList>

          {/* OVERVIEW & CONTACTS */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-card border-white/5 shadow-md">
                  <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Key Contacts & Stakeholders</CardTitle>
                      <CardDescription>Target decision makers mapped for outreach campaigns.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowAddContact(!showAddContact)}>
                      Add Contact
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-white/5">
                    {showAddContact && (
                      <form onSubmit={handleAddContactSubmit} className="p-4 bg-white/[0.02] grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Full Name *</label>
                          <input 
                            type="text" required value={cName} onChange={(e) => setCName(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Job Title</label>
                          <input 
                            type="text" value={cTitle} onChange={(e) => setCTitle(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Email *</label>
                          <input 
                            type="email" required value={cEmail} onChange={(e) => setCEmail(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Phone</label>
                          <input 
                            type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:col-span-2">
                          <input 
                            type="checkbox" id="cDM" checked={cDM} onChange={(e) => setCDM(e.target.checked)}
                            className="rounded border-white/10 text-primary bg-background"
                          />
                          <label htmlFor="cDM" className="text-xs text-muted-foreground cursor-pointer">Mark as key decision maker</label>
                        </div>
                        <div className="flex justify-end gap-2 md:col-span-2 mt-2">
                          <Button size="sm" type="button" variant="ghost" onClick={() => setShowAddContact(false)}>Cancel</Button>
                          <Button size="sm" type="submit">Save Contact</Button>
                        </div>
                      </form>
                    )}

                    {contacts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No mapped contacts found. Mapped target profiles will populate here.</p>
                    ) : (
                      contacts.map((contact) => (
                        <div key={contact.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {contact.full_name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-semibold text-sm flex items-center gap-2">
                                {contact.full_name}
                                {contact.is_decision_maker && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0">Decision Maker</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{contact.job_title || 'No Title Listed'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {contact.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {contact.email}</span>}
                            {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {contact.phone}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar stats panel */}
              <div className="space-y-6">
                <Card className="bg-card border-white/5 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm">Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">HQ Location</span>
                      <span className="font-medium">{account?.hq_location || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">City</span>
                      <span className="font-medium">{account?.city || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Country</span>
                      <span className="font-medium">{account?.country || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Corporate Website</span>
                      <span className="font-medium">{account?.website || '-'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">Phone Number</span>
                      <span className="font-medium">{account?.phone || '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* LINKED OPPORTUNITIES */}
          <TabsContent value="opportunities">
            <Card className="bg-card border-white/5 shadow-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-base flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Active Opportunities</CardTitle>
                <CardDescription>Open commercial scopes registered for this company.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-white/5">
                {opportunities.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Target className="w-12 h-12 opacity-20 mx-auto mb-3" />
                    <p className="text-sm">No opportunities registered.</p>
                    <Button className="mt-4" size="sm" onClick={() => navigate('/opportunities')}>Qualify New Scopes</Button>
                  </div>
                ) : (
                  opportunities.map((opp) => (
                    <div key={opp.id} className="p-5 flex items-center justify-between gap-6 hover:bg-white/[0.01] transition-colors group">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-foreground">{opp.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Stage: <span className="font-medium text-foreground capitalize">{opp.stage}</span></span>
                          <span>•</span>
                          <span>Score: <span className="font-medium text-amber-400">{opp.opportunity_strength || 0}%</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground">${(opp.estimated_value || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground block">Estimated ARR</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                          Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SIGNALS & TIMELINE */}
          <TabsContent value="signals" className="space-y-6">
            <Card className="bg-card border-white/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Radar className="w-5 h-5 text-purple-400" /> Intelligence Timeline</CardTitle>
                <CardDescription>Chronological feed of business signals extracted for this entity.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <SignalTimeline signals={signals} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
