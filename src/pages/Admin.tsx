import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText, CalendarCheck, Users, Briefcase, Mail, Activity, TrendingUp, Database, BarChart3, IndianRupee, PlusCircle, Award, BrainCircuit, Globe, Zap } from "lucide-react";
import AdminCrmTab from "@/components/AdminCrmTab";
import AdminAnalyticsTab from "@/components/AdminAnalyticsTab";
import AdminRevenueTab from "@/components/AdminRevenueTab";
import AdminPostRequirement from "@/components/AdminPostRequirement";
import AdminVerificationTab from "@/components/AdminVerificationTab";
import AdminTaxonomyTab from "@/components/AdminTaxonomyTab";
import AdminClassificationTab from "@/components/AdminClassificationTab";
import AdminLeadVerificationTab from "@/components/AdminLeadVerificationTab";
import AdminLeadIntelligenceCenter from "@/components/AdminLeadIntelligenceCenter";
import AdminIndustryTemplates from "@/components/AdminIndustryTemplates";
import AdminConnectorsTab from "@/components/AdminConnectorsTab";
import AdminBulkLeadsTab from "@/components/AdminBulkLeadsTab";
import AdminDataAcquisition from "./AdminDataAcquisition";
import AdminAutomationCenter from "./AdminAutomationCenter";
import { CardSkeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const Admin = () => {
  const { profile, loading: authLoading, user } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, totalLeads: 0, totalProjects: 0, subscribers: 0 });
  const [leadPipelineStats, setLeadPipelineStats] = useState({ pending: 0, verified: 0, rejected: 0, live: 0, inactive: 0 });
  
  const [pendingLeads, setPendingLeads] = useState<any[]>([]);
  const [rejectNote, setRejectNote] = useState<{ [id: string]: string }>({});
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [conversionReviews, setConversionReviews] = useState<any[]>([]);
  const [reviewQueueCount, setReviewQueueCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    if (profile && !profile.is_admin) { navigate("/"); return; }
  }, [authLoading, user, profile]);

  useEffect(() => {
    if (!profile?.is_admin) return;
    
    const fetchAdminData = async () => {
      try {
        // Fetch High-Level Stats
        const { count: usersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
        const { count: leadsCount } = await supabase.from("leads").select("*", { count: 'exact', head: true });
        const { count: projectsCount } = await supabase.from("projects").select("*", { count: 'exact', head: true });
        const { count: subsCount } = await supabase.from("newsletter_subscribers").select("*", { count: 'exact', head: true });
        
        setStats({ 
          users: usersCount || 0, 
          totalLeads: leadsCount || 0, 
          totalProjects: projectsCount || 0,
          subscribers: subsCount || 0
        });

        // Fetch Pipeline Stats
        const [{ count: pending }, { count: verified }, { count: rejected }, { count: live }, { count: inactive }] = await Promise.all([
          supabase.from("leads").select("*", { count: 'exact', head: true }).in("verification_status", ["pending", "submitted", "PENDING"]),
          supabase.from("leads").select("*", { count: 'exact', head: true }).in("verification_status", ["VERIFIED", "verified"]),
          supabase.from("leads").select("*", { count: 'exact', head: true }).in("verification_status", ["REJECTED", "rejected"]),
          supabase.from("leads").select("*", { count: 'exact', head: true }).eq("is_public", true).in("status", ["Planning", "Active", "Negotiation"]),
          supabase.from("leads").select("*", { count: 'exact', head: true }).in("status", ["Awarded", "Cancelled", "Archived"])
        ]);

        setLeadPipelineStats({
          pending: pending || 0,
          verified: verified || 0,
          rejected: rejected || 0,
          live: live || 0,
          inactive: inactive || 0
        });

        // Fetch pending leads
        const { data: leadsData } = await (supabase
          .from("leads")
          .select("*, profiles!leads_seller_id_fkey(full_name, company_name, email, phone, company_address, gst_number)") as any)
          .in("verification_status", ["pending", "submitted", "flagged", "PENDING", "SUSPICIOUS", "LOW_INTENT"])
          .order("created_at", { ascending: false });
        setPendingLeads(leadsData || []);

        // Fetch pending review queue count
        const { count: reviewCount } = await supabase
          .from("lead_review_queue")
          .select("*", { count: 'exact', head: true })
          .eq("status", "pending");
        setReviewQueueCount(reviewCount || 0);

        // Fetch Demos
        const { data: demoData } = await ((supabase as any).from("demo_requests") as any)
          .select("*")
          .order("created_at", { ascending: false });
        setDemoRequests(demoData || []);

        // Fetch Projects
        const { data: projData } = await supabase
          .from("projects")
          .select("*, profiles!projects_client_id_fkey(full_name, company_name)")
          .order("created_at", { ascending: false });
        setProjects(projData || []);

        // Fetch Subscribers
        const { data: subData } = await supabase
          .from("newsletter_subscribers")
          .select("*")
          .order("subscribed_at", { ascending: false });
        setSubscribers(subData || []);

        // Fetch Chart Data (Lead Growth)
        const { data: allLeads } = await supabase.from("leads").select("created_at");
        const monthCounts: Record<string, number> = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const d = new Date();
        for (let i = 5; i >= 0; i--) {
          const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
          monthCounts[`${months[pastDate.getMonth()]} ${pastDate.getFullYear()}`] = 0;
        }

        allLeads?.forEach(l => {
          const date = new Date(l.created_at);
          const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (monthCounts[key] !== undefined) {
            monthCounts[key]++;
          }
        });

        const formattedChartData = Object.keys(monthCounts).map(key => ({
          name: key,
          Leads: monthCounts[key]
        }));
        setChartData(formattedChartData);

        // Fetch pending conversion reviews
        const { data: reviewsData } = await (supabase as any)
          .from("conversion_reviews")
          .select("*, leads(id, title, location, category), submitter:profiles!conversion_reviews_submitted_by_fkey(full_name, company_name, email, phone)")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        setConversionReviews(reviewsData || []);

      } catch (error: any) {
        toast({ title: "Error fetching admin data", description: error.message, variant: "destructive" });
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchAdminData();
  }, [profile]);

  const handleDemoStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("demo_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Status updated" });
      setDemoRequests(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    }
  };

  const handleConversionReview = async (reviewId: string, action: 'approved' | 'rejected', leadId: string) => {
    try {
      // Update review status
      await (supabase as any)
        .from("conversion_reviews")
        .update({
          status: action,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (action === 'approved') {
        // Award badges to the lead
        await (supabase as any).from("lead_badges").upsert(
          { lead_id: leadId, badge_type: 'verified_conversion', awarded_by: profile.id },
          { onConflict: 'lead_id,badge_type' }
        );
        await (supabase as any).from("lead_badges").upsert(
          { lead_id: leadId, badge_type: 'converted', awarded_by: profile.id },
          { onConflict: 'lead_id,badge_type' }
        );

        toast({ title: "Conversion Approved ✅", description: "Lead marked as converted with badges." });
      } else {
        toast({ title: "Conversion Rejected" });
      }

      setConversionReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getAutoFlag = (lead: any) => {
    const issues: string[] = [];
    if (!lead.description || lead.description.length < 20) issues.push("Description too short");
    if (lead.budget_min && lead.budget_min < 50000) issues.push("Budget suspiciously low");
    if (!lead.budget_min && !lead.budget_max) issues.push("No budget entered");
    if (lead.title.length < 5) issues.push("Title too short");
    if (!lead.location) issues.push("No location");
    return issues;
  };

  const handleVerify = async (id: string) => {
    const { error } = await (supabase.from("leads").update({ verification_status: "VERIFIED", is_verified: true } as any) as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Lead Verified ✅", description: "Lead is now live." });
      setPendingLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    const note = rejectNote[id] || "Does not meet platform requirements.";
    const { error } = await (supabase.from("leads").update({ verification_status: "REJECTED", admin_notes: note } as any) as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Lead Rejected" });
      setPendingLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  if (authLoading || (!profile && user)) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!user || !profile?.is_admin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 pt-16">
        <section className="py-8 border-b relative" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%), hsl(222 47% 6%))', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,130,246,0.1)', border: '1px solid rgba(56,130,246,0.15)' }}>
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold">Admin Command Center</h1>
                  <p className="text-sm text-muted-foreground">Oversight, analytics, and platform moderation</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-6 bg-white/[0.03] border border-white/[0.06] flex w-full max-w-4xl mx-auto h-12 rounded-xl flex-wrap">
                <TabsTrigger value="dashboard" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Activity className="w-4 h-4 mr-2" /> Dashboard</TabsTrigger>
                <TabsTrigger value="data-acquisition" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Database className="w-4 h-4 mr-2" /> Data Acquisition</TabsTrigger>
                <TabsTrigger value="lead-intel" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><BrainCircuit className="w-4 h-4 mr-2" /> Lead Intel</TabsTrigger>
                <TabsTrigger value="automation" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Zap className="w-4 h-4 mr-2" /> Playbooks</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Database className="w-4 h-4 mr-2" /> Templates</TabsTrigger>
                <TabsTrigger value="scrapers" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Globe className="w-4 h-4 mr-2" /> Scrapers</TabsTrigger>
                <TabsTrigger value="approvals" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><ShieldCheck className="w-4 h-4 mr-2" /> Approvals</TabsTrigger>
                <TabsTrigger value="projects" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Briefcase className="w-4 h-4 mr-2" /> Projects</TabsTrigger>
                <TabsTrigger value="subscribers" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Mail className="w-4 h-4 mr-2" /> Subscribers</TabsTrigger>
                <TabsTrigger value="crm" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Database className="w-4 h-4 mr-2" /> CRM</TabsTrigger>
                <TabsTrigger value="lead-verification" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Lead Verification Center
                  {reviewQueueCount > 0 && <Badge className="ml-1 text-[10px] px-1.5 py-0" variant="destructive">{reviewQueueCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="verification" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><ShieldCheck className="w-4 h-4 mr-2" /> Verify</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</TabsTrigger>
                <TabsTrigger value="revenue" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><IndianRupee className="w-4 h-4 mr-2" /> Revenue</TabsTrigger>
                <TabsTrigger value="post" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><PlusCircle className="w-4 h-4 mr-2" /> Post Lead</TabsTrigger>
                <TabsTrigger value="bulk_leads" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Database className="w-4 h-4 mr-2" /> Bulk Leads</TabsTrigger>
                <TabsTrigger value="taxonomy" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Database className="w-4 h-4 mr-2" /> Taxonomy</TabsTrigger>
                <TabsTrigger value="classify" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Activity className="w-4 h-4 mr-2" /> Classify</TabsTrigger>
                <TabsTrigger value="conversions" className="flex-1 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Award className="w-4 h-4 mr-2" /> Conversions
                  {conversionReviews.length > 0 && <Badge className="ml-1 text-[10px] px-1.5 py-0" variant="destructive">{conversionReviews.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* DATA ACQUISITION TAB */}
              <TabsContent value="data-acquisition" className="space-y-6">
                <AdminDataAcquisition />
              </TabsContent>

              {/* AUTOMATION PLAYBOOKS TAB */}
              <TabsContent value="automation" className="space-y-6">
                <AdminAutomationCenter embedded={true} />
              </TabsContent>

              {/* DASHBOARD TAB */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <Users className="w-6 h-6 text-blue-500 mb-2" />
                      <p className="text-3xl font-bold">{stats.users}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <FileText className="w-6 h-6 text-emerald-500 mb-2" />
                      <p className="text-3xl font-bold">{stats.totalLeads}</p>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <Briefcase className="w-6 h-6 text-amber-500 mb-2" />
                      <p className="text-3xl font-bold">{stats.totalProjects}</p>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="p-6">
                      <Mail className="w-6 h-6 text-purple-500 mb-2" />
                      <p className="text-3xl font-bold">{stats.subscribers}</p>
                      <p className="text-sm text-muted-foreground">Newsletter Subscribers</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Lead Pipeline Audit Widget */}
                <Card className="bg-card/40 border-white/5 mt-6">
                  <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Lead Pipeline Audit
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Real-time database reconciliation of lead records.</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase font-semibold mb-1">Total Imported</div>
                        <div className="text-2xl font-bold text-white">{stats.totalLeads}</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase font-semibold mb-1">Pending Review</div>
                        <div className="text-2xl font-bold text-amber-400">{leadPipelineStats.pending}</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase font-semibold mb-1">Total Approved</div>
                        <div className="text-2xl font-bold text-emerald-400">{leadPipelineStats.verified}</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-4 text-center border border-emerald-500/20">
                        <div className="text-emerald-500/80 text-xs uppercase font-semibold mb-1 flex items-center justify-center gap-1">
                          <Activity className="w-3 h-3" /> Live Marketplace
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{leadPipelineStats.live}</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/5">
                        <div className="text-muted-foreground text-xs uppercase font-semibold mb-1">Inactive / Rejected</div>
                        <div className="text-2xl font-bold text-rose-400">{leadPipelineStats.inactive + leadPipelineStats.rejected}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Lead Growth (Last 6 Months)</CardTitle>
                    <CardDescription>Number of new leads posted to the marketplace</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {dataLoading ? (
                      <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(10, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="Leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* APPROVALS TAB */}
              <TabsContent value="approvals" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEADS COLUMN */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                      Pending Leads {pendingLeads.length > 0 && <Badge>{pendingLeads.length}</Badge>}
                    </h3>
                    <div className="space-y-4">
                      {dataLoading ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />) : 
                        pendingLeads.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success/50" /> No pending leads
                        </div>
                      ) : pendingLeads.map(lead => {
                        const flags = getAutoFlag(lead);
                        return (
                          <Card key={lead.id} className={`bg-card/50 ${flags.length > 0 ? "border-accent/40" : "border-white/5"}`}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base font-sans">{lead.title}</CardTitle>
                                  <p className="text-xs text-muted-foreground mt-1">₹{lead.budget_min?.toLocaleString() ?? "—"} – ₹{lead.budget_max?.toLocaleString() ?? "—"}</p>
                                </div>
                                <Badge variant={lead.verification_status === "flagged" ? "destructive" : "secondary"}>
                                  {lead.verification_status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0 text-sm">
                              <div className="p-2 bg-white/5 rounded mt-2 text-xs text-muted-foreground">
                                By: {lead.profiles?.company_name || lead.profiles?.full_name || "Unknown"} <br/>
                                Email: {lead.profiles?.email || "Unknown"}
                              </div>
                              {flags.length > 0 && (
                                <div className="text-xs text-accent">
                                  <strong>Flags:</strong> {flags.join(", ")}
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" className="flex-1" onClick={() => handleVerify(lead.id)}>Verify</Button>
                                <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(lead.id)}>Reject</Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  {/* DEMOS COLUMN */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                      Demo Requests {demoRequests.length > 0 && <Badge variant="secondary">{demoRequests.length}</Badge>}
                    </h3>
                    <div className="space-y-4">
                      {dataLoading ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />) : 
                        demoRequests.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success/50" /> No demo requests
                        </div>
                      ) : demoRequests.map(demo => (
                        <Card key={demo.id} className="bg-card/50 border-white/5">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base font-sans">{demo.company_name}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">{demo.role === 'client' ? 'Client' : 'Vendor'} • {demo.location}</p>
                              </div>
                              <Badge variant={demo.status === 'pending' ? 'secondary' : 'success'}>{demo.status}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0 text-sm">
                            <div className="p-2 bg-white/5 rounded mt-2 text-xs text-muted-foreground">
                              {demo.full_name} • {demo.email} • {demo.phone}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {demo.status === "done" ? (
                                <Button size="sm" disabled className="flex-1 opacity-60">Done</Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDemoStatus(demo.id, "contacted")}>Contacted</Button>
                                  <Button size="sm" className="flex-1" onClick={() => handleDemoStatus(demo.id, "done")}>Mark Done</Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* PROJECTS TAB */}
              <TabsContent value="projects">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle>Active Projects Oversight</CardTitle>
                    <CardDescription>View all ongoing projects converted from the marketplace.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dataLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : projects.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">No active projects found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-6 py-3 font-medium">Project Title</th>
                              <th className="px-6 py-3 font-medium">Client</th>
                              <th className="px-6 py-3 font-medium">Budget</th>
                              <th className="px-6 py-3 font-medium">Status</th>
                              <th className="px-6 py-3 font-medium">Started</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projects.map(p => (
                              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="px-6 py-4 font-medium text-foreground">{p.title}</td>
                                <td className="px-6 py-4 text-muted-foreground">{p.profiles?.company_name || p.profiles?.full_name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-muted-foreground">₹{Number(p.budget).toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4"><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{p.status}</Badge></td>
                                <td className="px-6 py-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SUBSCRIBERS TAB */}
              <TabsContent value="subscribers">
                <Card className="bg-card/40 border-white/5 max-w-3xl mx-auto">
                  <CardHeader>
                    <CardTitle>Newsletter Subscribers</CardTitle>
                    <CardDescription>Emails captured from the footer "Stay Updated" form.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dataLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : subscribers.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">No subscribers yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {subscribers.map((sub, i) => (
                          <div key={sub.id} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                            <span className="font-medium">{sub.email}</span>
                            <span className="text-xs text-muted-foreground">{new Date(sub.subscribed_at).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CRM MANAGEMENT TAB */}
              <TabsContent value="crm" className="mt-6">
                <AdminCrmTab />
              </TabsContent>
              
              <TabsContent value="bulk_leads" className="mt-6">
                <AdminBulkLeadsTab />
              </TabsContent>

              {/* LEAD VERIFICATION CENTER TAB */}
              <TabsContent value="lead-verification">
                <AdminLeadVerificationTab />
              </TabsContent>

              {/* VERIFICATION TAB */}
              <TabsContent value="verification">
                <AdminVerificationTab />
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics">
                <AdminAnalyticsTab />
              </TabsContent>

              {/* REVENUE TAB */}
              <TabsContent value="revenue">
                <AdminRevenueTab />
              </TabsContent>

              {/* POST REQUIREMENT TAB */}
              <TabsContent value="post">
                <AdminPostRequirement adminProfile={profile} />
              </TabsContent>

              {/* TAXONOMY MANAGEMENT TAB */}
              <TabsContent value="taxonomy">
                <AdminTaxonomyTab />
              </TabsContent>

              {/* LEAD CLASSIFICATION TAB */}
              <TabsContent value="classify">
                <AdminClassificationTab />
              </TabsContent>

              {/* CONVERSION REVIEWS TAB */}
              <TabsContent value="conversions" className="space-y-6">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-500" /> Conversion Reviews
                    </CardTitle>
                    <CardDescription>Users who claim a lead converted. Verify and approve to award badges.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {conversionReviews.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success/50" /> No pending conversion reviews
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversionReviews.map((review: any) => (
                          <Card key={review.id} className="bg-card/50 border-white/5">
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-foreground">{review.leads?.title || 'Unknown Lead'}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {review.leads?.location} · {review.leads?.category}
                                  </p>
                                </div>
                                <Badge variant="secondary">Pending Review</Badge>
                              </div>
                              <div className="p-3 bg-white/5 rounded-lg text-sm text-muted-foreground">
                                <p><strong>Claimed by:</strong> {review.submitter?.company_name || review.submitter?.full_name || 'Unknown'}</p>
                                <p><strong>Email:</strong> {review.submitter?.email}</p>
                                <p><strong>Phone:</strong> {review.submitter?.phone || '—'}</p>
                                <p className="text-xs mt-1">Submitted: {new Date(review.created_at).toLocaleDateString('en-IN')}</p>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => handleConversionReview(review.id, 'approved', review.lead_id)}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Award Badge
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1 gap-1.5" onClick={() => handleConversionReview(review.id, 'rejected', review.lead_id)}>
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LEAD INTELLIGENCE CENTER TAB */}
              <TabsContent value="lead-intel" className="space-y-6">
                <AdminLeadIntelligenceCenter />
              </TabsContent>

              {/* INDUSTRY TEMPLATES TAB */}
              <TabsContent value="templates" className="space-y-6">
                <AdminIndustryTemplates />
              </TabsContent>

              {/* SCRAPERS & CONNECTORS TAB */}
              <TabsContent value="scrapers" className="space-y-6">
                <AdminConnectorsTab />
              </TabsContent>

            </Tabs>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;