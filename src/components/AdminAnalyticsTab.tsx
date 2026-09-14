import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Search, Building2, Users, TrendingUp, Target,
  CheckCircle2, XCircle, Clock, Briefcase, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";

const AdminAnalyticsTab = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyStats, setCompanyStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Platform-wide stats
  const [platformStats, setPlatformStats] = useState<any>(null);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      // Get all companies with subscriptions or any activity
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setCompanies(profiles || []);

      // Platform-wide aggregates
      const { count: totalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true });
      const { count: activeLeads } = await (supabase.from("leads").select("*", { count: "exact", head: true }) as any).in("status", ["Planning", "Active", "Negotiation"]);
      const { count: closedLeads } = await (supabase.from("leads").select("*", { count: "exact", head: true }) as any).in("status", ["Awarded", "Cancelled", "Archived"]);
      const { count: totalProjects } = await supabase.from("projects").select("*", { count: "exact", head: true });
      const { count: totalUnlocks } = await supabase.from("lead_unlocks").select("*", { count: "exact", head: true });

      // Active subscribers (non-free plans)
      const activeSubscribers = (profiles || []).filter(
        (p: any) => p.subscription_plan && p.subscription_plan !== "free"
      ).length;

      // Meetings booked
      const { count: meetingsCount } = await (supabase as any)
        .from("demo_requests")
        .select("*", { count: "exact", head: true });

      setPlatformStats({
        totalLeads: totalLeads || 0,
        activeLeads: activeLeads || 0,
        closedLeads: closedLeads || 0,
        totalProjects: totalProjects || 0,
        totalUnlocks: totalUnlocks || 0,
        activeSubscribers,
        totalCompanies: (profiles || []).length,
        meetingsBooked: meetingsCount || 0,
      });

      setLoaded(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const selectCompany = async (company: any) => {
    setSelectedCompany(company);
    setStatsLoading(true);
    try {
      // Leads posted by this company
      const { data: leads } = await (supabase.from("leads").select("*") as any).eq("seller_id", company.id);
      const companyLeads = leads || [];

      // Unlocks by this company
      const { data: unlocks } = await supabase.from("lead_unlocks").select("*").eq("company_id", company.id);

      // Unlocks received on their leads
      const leadIds = companyLeads.map((l: any) => l.id);
      let unlocksReceived: any[] = [];
      if (leadIds.length > 0) {
        const { data: recvUnlocks } = await supabase.from("lead_unlocks").select("*").in("lead_id", leadIds);
        unlocksReceived = recvUnlocks || [];
      }

      // Projects
      const { data: projects } = await supabase.from("projects").select("*").eq("client_id", company.id);

      // Meetings booked
      const { data: meetings } = await (supabase as any)
        .from("demo_requests")
        .select("*")
        .eq("email", company.email);

      const totalSpent = (unlocks || []).reduce((sum: number, u: any) => sum + (u.amount_paid || 0), 0);

      setCompanyStats({
        leadsPosted: companyLeads.length,
        activeLeads: companyLeads.filter((l: any) => l.status === "active").length,
        closedLeads: companyLeads.filter((l: any) => l.status === "closed").length,
        unlocksReceived: unlocksReceived.length,
        leadsUnlocked: (unlocks || []).length,
        totalSpent,
        projects: (projects || []).length,
        activeProjects: (projects || []).filter((p: any) => p.status === "active" || p.status === "in_progress").length,
        meetingsBooked: (meetings || []).length,
      });
    } catch (err: any) {
      toast({ title: "Error loading stats", description: err.message, variant: "destructive" });
    }
    setStatsLoading(false);
  };

  const filteredCompanies = companies.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  // If a company is selected, show detail view
  if (selectedCompany) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2 mb-2" onClick={() => { setSelectedCompany(null); setCompanyStats(null); }}>
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Button>

        {/* Company Header */}
        <Card className="bg-card/40 border-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {(selectedCompany.company_name || selectedCompany.full_name || "?").charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{selectedCompany.company_name || selectedCompany.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedCompany.email} · {selectedCompany.user_type}</p>
              </div>
              <Badge
                className="text-xs border-0 px-3 py-1"
                style={{
                  background: selectedCompany.subscription_plan && selectedCompany.subscription_plan !== "free"
                    ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.12)",
                  color: selectedCompany.subscription_plan && selectedCompany.subscription_plan !== "free"
                    ? "#10B981" : "#6B7280",
                }}
              >
                {selectedCompany.subscription_plan || "free"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {statsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : companyStats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Leads Posted", value: companyStats.leadsPosted, icon: Target, color: "#3B82F6" },
                { label: "Active Leads", value: companyStats.activeLeads, icon: TrendingUp, color: "#10B981" },
                { label: "Closed / Converted", value: companyStats.closedLeads, icon: CheckCircle2, color: "#22D3EE" },
                { label: "Unlocks Received", value: companyStats.unlocksReceived, icon: Users, color: "#8B5CF6" },
                { label: "Leads Unlocked", value: companyStats.leadsUnlocked, icon: Target, color: "#EC4899" },
                { label: "Total Spent", value: `₹${companyStats.totalSpent.toLocaleString("en-IN")}`, icon: TrendingUp, color: "#F59E0B" },
                { label: "Projects", value: companyStats.projects, icon: Briefcase, color: "#3B82F6" },
                { label: "Active Projects", value: companyStats.activeProjects, icon: Clock, color: "#22D3EE" },
                { label: "Meetings Booked", value: companyStats.meetingsBooked, icon: Clock, color: "#8B5CF6" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="bg-card/40 border-white/5">
                    <CardContent className="pt-4 pb-4 text-center">
                      <stat.icon className="h-5 w-5 mx-auto mb-2" style={{ color: stat.color }} />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      {platformStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Companies", value: platformStats.totalCompanies, icon: Building2, color: "#3B82F6" },
            { label: "Active Subscribers", value: platformStats.activeSubscribers, icon: Users, color: "#10B981" },
            { label: "Active Leads", value: platformStats.activeLeads, icon: Target, color: "#22D3EE" },
            { label: "Closed Leads", value: platformStats.closedLeads, icon: XCircle, color: "#EF4444" },
            { label: "Total Projects", value: platformStats.totalProjects, icon: Briefcase, color: "#8B5CF6" },
            { label: "Total Unlocks", value: platformStats.totalUnlocks, icon: TrendingUp, color: "#F59E0B" },
            { label: "Meetings Booked", value: platformStats.meetingsBooked, icon: Clock, color: "#EC4899" },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-card/40 border-white/5">
              <CardContent className="pt-4 pb-4 text-center">
                <stat.icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company List */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Active Companies
            </CardTitle>
            <Button size="sm" variant="outline" className="border-white/10 gap-1.5" onClick={loadCompanies} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {loaded ? "Refresh" : "Load"}
            </Button>
          </div>
          {loaded && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <p className="text-sm text-muted-foreground text-center py-8">Click "Load" to view all companies.</p>
          ) : filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No companies found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
              {filteredCompanies.map((c, idx) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  onClick={() => selectCompany(c)}
                  className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(c.company_name || c.full_name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{c.company_name || c.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <Badge
                      className="text-[9px] border-0 shrink-0"
                      style={{
                        background: c.subscription_plan && c.subscription_plan !== "free"
                          ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.12)",
                        color: c.subscription_plan && c.subscription_plan !== "free"
                          ? "#10B981" : "#6B7280",
                      }}
                    >
                      {c.subscription_plan || "free"}
                    </Badge>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsTab;
