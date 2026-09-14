import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OpportunityScoreBadge } from "@/components/lead/OpportunityScoreBadge";
import { IntentBadge } from "@/components/lead/IntentBadge";
import { AISummaryPanel } from "@/components/lead/AISummaryPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { LeadTable } from "@/components/crm/LeadTable";
import { CrmKanbanView } from "@/components/crm/CrmKanbanView";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Download,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Crown,
  Star,
  FileSpreadsheet,
  FileText,
  Lock,
  Unlock,
  Globe,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  CreditCard,
  Phone,
  Mail,
  Building,
  ExternalLink,
  Calendar,
  Info,
  MapPin,
  Tag,
  DollarSign,
  Maximize,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CrmLead, PLAN_QUOTAS, LEAD_STATUS_CONFIG, USER_STATUS_OPTIONS, getQuotaForPlan, EXTRA_LEAD_PRICE } from "@/types/crm";
import { exportToCSV, exportToExcel, copyLeadToClipboard } from "@/utils/exportUtils";
import { useBusinessProfileContext } from "@/contexts/BusinessProfileContext";
import AISearchBar from "@/components/AISearchBar";
import { OutreachGeneratorModal } from "@/components/OutreachGeneratorModal";
import { trackEvent } from "@/utils/analytics";

const PLAN_ICONS: Record<string, any> = {
  free: Zap,
  basic: Star,
  premium: Crown,
  elite: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "#6B7280",
  basic: "#3B82F6",
  premium: "#22D3EE",
  elite: "#F59E0B",
};

const CrmLeadsView = () => {
  const { user, profile } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { crmLabel, businessProfile, needsOnboarding, industryName } = useBusinessProfileContext();

  const [loading, setLoading] = useState(true);
  const [verifiedLeads, setVerifiedLeads] = useState<any[]>([]);
  const [autoLeads, setAutoLeads] = useState<any[]>([]);
  const [marketplaceLeads, setMarketplaceLeads] = useState<any[]>([]);
  const [userUnlocks, setUserUnlocks] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [feedbackLead, setFeedbackLead] = useState<any | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>('in_discussion');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const currentPlan = profile?.subscription_plan || "free";
  const isPremiumOrElite = ['premium', 'elite'].includes(currentPlan);
  const isBasic = currentPlan === 'basic';
  const isPaidUser = ['basic', 'premium', 'elite'].includes(currentPlan);
  const planConfig = PLAN_QUOTAS[currentPlan] || PLAN_QUOTAS.free;
  const PlanIcon = PLAN_ICONS[currentPlan] || Zap;
  const planColor = PLAN_COLORS[currentPlan] || "#6B7280";

  useEffect(() => {
    if (!user || !profile) return;
    trackEvent('crm_opened');
    fetchCrmData();

      const crmSubscription = supabase
      .channel('custom-crm-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assigned_leads', filter: `client_id=eq.${profile.id}` },
        () => {
          fetchCrmData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(crmSubscription);
    };
  }, [user, profile]);

  const trackExportMetrics = async (crmLeads: any[]) => {
    try {
      for (const l of crmLeads) {
        const match = l.notes?.match(/Marketplace Lead ID: ([\w-]+)/);
        const leadId = match ? match[1] : null;
        if (leadId) {
          await supabase.rpc('increment_lead_metric', { lead_id: leadId, metric_name: 'exports' });
        }
      }
    } catch (e) {
      console.warn("Failed to track exports metric:", e);
    }
  };

  const fetchCrmData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch leads assigned to this user from assigned_leads and join with leads
      const { data: assignmentsData, error: leadsErr } = await (supabase as any)
        .from("assigned_leads")
        .select("*, leads(*)")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (leadsErr) throw leadsErr;

      const leads = (assignmentsData || []).map((a: any) => ({
        ...(a.leads || {}),
        assignment_id: a.id,
        crm_status: a.status || 'New',
        is_contacted: a.is_contacted,
        crm_lead_id: a.id,
      }));

      setVerifiedLeads(leads.filter((l: any) => l.verification_status === "VERIFIED" || l.source_origin === "admin_manual"));
      setAutoLeads(leads.filter((l: any) => l.source === "auto" || l.source_type === "auto"));

      // Fetch user's unlocks
      const { data: unlocks } = await supabase
        .from("lead_unlocks")
        .select("lead_id")
        .eq("company_id", profile.id);
      const unlockedIds = (unlocks || []).map((u: any) => u.lead_id);
      setUserUnlocks(new Set(unlockedIds));

      // Fetch conversion reviews
      const { data: reviews } = await supabase
        .from("conversion_reviews")
        .select("*")
        .eq("submitted_by", profile.id);
      setPendingReviews(reviews || []);

      const isPrem = ['premium', 'elite'].includes(profile?.subscription_plan);
      let mktQuery = supabase
        .from("leads")
        .select("id, title, location, category, budget_min, budget_max, description, project_type, created_at, status, lead_number, industry_id")
        .in("verification_status", ["VERIFIED", "verified"])
        .order("created_at", { ascending: false });

      // CORE PERSONALIZATION: Filter by user's industry
      if (businessProfile?.industry_id) {
        mktQuery = mktQuery.eq("industry_id", businessProfile.industry_id);
      }

      // Premium/Elite: see ALL relevant leads (higher limit)
      // Basic/Free: exclude own leads, standard limit
      if (isPrem) {
        mktQuery = mktQuery.in("status", ["Planning", "Active", "Negotiation"]).limit(500);
      } else {
        mktQuery = mktQuery.neq("seller_id", profile.id).limit(100);
        if (unlockedIds.length > 0) {
          mktQuery = mktQuery.or(`status.in.(Planning,Active,Negotiation),id.in.(${unlockedIds.join(',')})`);
        } else {
          mktQuery = mktQuery.in("status", ["Planning", "Active", "Negotiation"]);
        }
      }

      const { data: mktLeads } = await mktQuery;
      setMarketplaceLeads(mktLeads || []);

      // Sync Premium/Elite CRM leads automatically by industry niche
      if (isPremiumOrElite && businessProfile?.industry_id) {
        try {
          const { data: matchingLeads } = await supabase
            .from("leads")
            .select("*")
            .eq("industry_id", businessProfile.industry_id)
            .in("status", ["Planning", "Active", "Negotiation"])
            .in("verification_status", ["VERIFIED", "verified"]);

          if (matchingLeads && matchingLeads.length > 0) {
            const { data: existingCrmLeads } = await supabase
              .from("assigned_leads")
              .select("lead_id")
              .eq("client_id", profile.id);

            const existingLeadIds = new Set(
              (existingCrmLeads || [])
                .map((l: any) => l.lead_id)
                .filter(Boolean)
            );

            let newLeadsToSync = matchingLeads.filter((l: any) => !existingLeadIds.has(l.id));

            if (currentPlan === 'elite') {
              // Elite users get priority verified leads first
              newLeadsToSync = [...newLeadsToSync].sort((a: any, b: any) => 
                (b.trust_score || 0) - (a.trust_score || 0) || 
                (b.intent_score || 0) - (a.intent_score || 0)
              );
            }

            if (newLeadsToSync.length > 0) {
              const inserts = newLeadsToSync.map((lead: any) => ({
                client_id: profile.id,
                lead_id: lead.id,
                status: 'New',
                is_contacted: false
              }));

              const { error: insertErr } = await supabase
                .from("assigned_leads")
                .insert(inserts);
              
              if (!insertErr) {
                // Re-fetch assigned leads
                fetchCrmData();
              }
            }
          }
        } catch (e) {
          console.error("Auto sync matching error:", e);
        }
      }

      // Fetch quota for current month
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: quotaData } = await (supabase as any)
        .from("quota_tracking")
        .select("*")
        .eq("user_id", profile.id)
        .eq("month", monthStart)
        .maybeSingle();

      setQuota(quotaData);
    } catch (err: any) {
      console.error("CRM fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from("assigned_leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated" });
      
      // Log activity in timeline
      await supabase.from("activities").insert({
        workspace_id: profile.id,
        activity_type: 'system',
        title: `Lead status updated to ${newStatus}`,
        opportunity_id: leadId,
        created_by: profile.id
      });
      
      // Update local state
      const updateList = (list: any[]) =>
        list.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
      setVerifiedLeads(updateList);
      setAutoLeads(updateList);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackLead || !profile) return;
    setSubmittingFeedback(true);
    try {
      const targetLeadId = feedbackLead.lead_id || feedbackLead.id;
      
      // 1. Insert or update feedback
      const { data: feedbackData, error: feedbackError } = await (supabase as any)
        .from("lead_feedback")
        .upsert({
          lead_id: targetLeadId,
          user_id: profile.id,
          feedback_type: feedbackType,
          notes: feedbackNotes
        }, { onConflict: 'lead_id,user_id' })
        .select()
        .single();
      
      if (feedbackError) throw feedbackError;

      // 2. If 'converted_successfully', insert conversion_reviews record
      if (feedbackType === 'converted_successfully') {
        const { error: reviewError } = await (supabase as any)
          .from("conversion_reviews")
          .insert({
            lead_id: targetLeadId,
            submitted_by: profile.id,
            feedback_id: feedbackData.id,
            status: 'pending'
          });
        if (reviewError) throw reviewError;
        toast({
          title: "Conversion Claim Submitted",
          description: "Admin will verify this conversion to unlock global badges."
        });
      } else {
        toast({
          title: "Feedback Saved",
          description: "Thank you for updating the lead status!"
        });
      }

      setFeedbackDialogOpen(false);
      setFeedbackNotes('');
      fetchCrmData();
    } catch (err: any) {
      toast({
        title: "Error submitting feedback",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCopy = (lead: any) => {
    copyLeadToClipboard(lead);
    setCopiedId(lead.id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const filterLeads = (leads: any[]) => {
    let filtered = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.requirement?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    return filtered;
  };

  const prepareExportData = (leads: any[]) =>
    leads.map((l) => ({
      Name: l.name || "",
      Phone: l.phone || "",
      Email: l.email || "",
      Company: l.company || "",
      Location: l.location || "",
      Requirement: l.requirement || "",
      Status: l.status || "",
      Date: l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN") : "",
    }));

  const billingCycle = profile?.billing_cycle || '1y';
  const delivered = quota?.delivered || verifiedLeads.length;
  const quotaLimit = quota?.quota_limit || getQuotaForPlan(currentPlan, billingCycle);
  const remaining = quotaLimit === Infinity ? Infinity : Math.max(0, quotaLimit - delivered);
  const quotaPercent = quotaLimit === Infinity ? 0 : (quotaLimit > 0 ? Math.min(100, (delivered / quotaLimit) * 100) : 0);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-md mx-4 w-full">
          <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to access CRM.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Loading your business CRM...</span>
      </div>
    );
  }

  // Premium/Elite: see all active niche marketplace leads automatically.
  // Basic/Free: only see paid leads they've already unlocked.
  const displayMarketplaceLeads = isPremiumOrElite 
    ? marketplaceLeads 
    : marketplaceLeads.filter(l => userUnlocks.has(l.id));

  // Onboarding gate: block CRM if profile not completed or niche not set
  const missingNiche = !businessProfile || !businessProfile.industry_id;
  if (needsOnboarding || missingNiche) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-lg px-4">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3 text-foreground">
              Complete Your Business Profile
            </h1>
            <p className="text-muted-foreground mb-6">
              To access your personalized {industryName || 'business'} CRM, please complete your business profile first. 
              Your CRM will only show leads relevant to your industry.
            </p>
            <Button
              onClick={() => navigate("/onboarding")}
              className="h-12 px-8 gap-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', boxShadow: '0 0 25px rgba(59,130,246,0.25)' }}
            >
              <Sparkles className="h-4 w-4" /> Complete Business Profile
            </Button>
          </div>
        </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* ── HEADER ── */}
      <section
        className="py-8 border-b relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(222 47% 4%), hsl(222 47% 6%))",
            borderColor: "rgba(255,255,255,0.04)",
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute -top-20 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
            style={{ background: `${planColor}08` }}
          />

          <div className="w-full max-w-[1600px] mx-auto px-6 relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              {/* Title + Plan */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${planColor}15`, border: `1px solid ${planColor}25` }}
                >
                  <PlanIcon
                    className="h-6 w-6"
                    style={{ color: planColor, filter: `drop-shadow(0 0 6px ${planColor})` }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-display font-bold text-foreground">{crmLabel}</h1>
                    <Badge
                      className="text-[10px] border-0 px-2 py-0.5"
                      style={{ background: `${planColor}20`, color: planColor }}
                    >
                      {planConfig.label} Plan
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your verified and auto-generated leads
                  </p>
                </div>
              </div>

              {/* Quota Summary Cards */}
              <div className="flex flex-wrap gap-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div
                    className="px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Target className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lead Quota</p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {quotaLimit === Infinity ? "Unlimited" : quotaLimit}
                      </p>
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <div
                    className="px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lead Usage</p>
                      <p className="text-lg font-bold text-foreground tabular-nums">{delivered}</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div
                    className="px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)" }}
                  >
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining Leads</p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {remaining === Infinity ? "Unlimited" : remaining}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Quota Progress Bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Premium Lead Delivery Progress
                </span>
                <span className="text-xs font-semibold" style={{ color: planColor }}>
                  {quotaLimit === Infinity ? `${delivered} Used` : `${delivered} / ${quotaLimit}`}
                </span>
              </div>
              {quotaLimit !== Infinity && (
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${planColor}, ${planColor}aa)`,
                      boxShadow: `0 0 12px ${planColor}40`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${quotaPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              )}
              {remaining === 0 && quotaLimit > 0 && quotaLimit !== Infinity && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="text-[10px] border-0" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                    Quota Full
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    style={{ borderColor: "rgba(245,158,11,0.2)", color: "#F59E0B" }}
                    onClick={() => toast({ title: "Extra Leads", description: `₹${EXTRA_LEAD_PRICE}/lead. Contact admin to unlock more.` })}
                  >
                    <CreditCard className="h-3 w-3" /> Buy Extra (₹{EXTRA_LEAD_PRICE}/lead)
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── MAIN CONTENT ── */}
        <section className="py-8">
          <div className="w-full max-w-[1600px] mx-auto px-6">
            <Tabs defaultValue={isPaidUser ? "verified" : "unlocked"} className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <TabsList className="bg-white/[0.03] border border-white/[0.06] h-11 rounded-xl">
                  {isPaidUser && (
                    <TabsTrigger
                      value="verified"
                      className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Premium Leads
                      {verifiedLeads.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                          {verifiedLeads.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="auto"
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    My Saved Leads
                    {autoLeads.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        {autoLeads.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {!isPaidUser && (
                    <TabsTrigger
                      value="unlocked"
                      className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Unlocked Leads
                      {userUnlocks.size > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                          {userUnlocks.size}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="marketplace"
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Marketplace
                    {displayMarketplaceLeads.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        {displayMarketplaceLeads.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-56 h-9 bg-white/[0.03] border-white/[0.08] text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-9 bg-white/[0.03] border-white/[0.08] text-sm">
                      <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-white/10"
                    onClick={fetchCrmData}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
              </div>

              {isPaidUser ? (
                <>
                  {/* ── VERIFIED LEADS TAB ── */}
                  <TabsContent value="verified">
                    <CrmKanbanView
                      leads={filterLeads(verifiedLeads)}
                      loading={loading}
                      onStatusChange={handleStatusChange}
                      onCopy={handleCopy}
                      onViewDetails={openLeadDetails}
                      copiedId={copiedId}
                      onExportCSV={() => {
                        exportToCSV(prepareExportData(filterLeads(verifiedLeads)), "premium_leads.csv");
                        trackExportMetrics(filterLeads(verifiedLeads));
                        toast({ title: "CSV Downloaded" });
                      }}
                      onExportExcel={async () => {
                        await exportToExcel(prepareExportData(filterLeads(verifiedLeads)), "premium_leads.xlsx");
                        trackExportMetrics(filterLeads(verifiedLeads));
                        toast({ title: "Excel Downloaded" });
                      }}
                      emptyIcon={<ShieldCheck className="h-10 w-10 text-muted-foreground/30" />}
                      emptyText="No premium leads delivered yet. Your admin will assign leads based on your plan quota."
                      sourceLabel="verified"
                    />
                  </TabsContent>

                  {/* ── AUTO LEADS TAB removed from here, moved to below ── */}

              {/* ── MY SAVED LEADS TAB (Accessible to all) ── */}
              <TabsContent value="auto">
                <CrmKanbanView
                  leads={filterLeads(autoLeads)}
                  loading={loading}
                  onStatusChange={handleStatusChange}
                  onCopy={handleCopy}
                  onViewDetails={openLeadDetails}
                  copiedId={copiedId}
                  onExportCSV={() => {
                    exportToCSV(prepareExportData(filterLeads(autoLeads)), "my_saved_leads.csv");
                    trackExportMetrics(filterLeads(autoLeads));
                    toast({ title: "CSV Downloaded" });
                  }}
                  onExportExcel={async () => {
                    await exportToExcel(prepareExportData(filterLeads(autoLeads)), "my_saved_leads.xlsx");
                    trackExportMetrics(filterLeads(autoLeads));
                    toast({ title: "Excel Downloaded" });
                  }}
                  emptyIcon={<Zap className="h-10 w-10 text-muted-foreground/30" />}
                  emptyText="No saved leads yet. Leads you save from the Lead Database will appear here."
                  sourceLabel="auto"
                />
              </TabsContent>

                  {/* ── MARKETPLACE LEADS TAB ── */}
                  <TabsContent value="marketplace">
                    <Card className="bg-card/40 border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{displayMarketplaceLeads.length}</span> marketplace lead{displayMarketplaceLeads.length !== 1 ? 's' : ''}
                          {isPremiumOrElite && <span className="ml-2 text-xs text-emerald-500">Full Access</span>}
                          {isBasic && <span className="ml-2 text-xs text-blue-400">Unlock to view contacts</span>}
                        </p>
                      </div>
                      {displayMarketplaceLeads.length === 0 ? (
                        <CardContent className="py-20 text-center">
                          <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                          <p className="text-muted-foreground mt-3 text-sm">No marketplace leads available yet.</p>
                          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => navigate('/tenders')}>
                            <Search className="h-3.5 w-3.5" /> Browse Lead Database
                          </Button>
                        </CardContent>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="text-sm text-muted-foreground uppercase bg-white/[0.02] border-b border-white/[0.06]">
                                <th className="px-5 py-3 font-medium">Title</th>
                                <th className="px-5 py-3 font-medium">Location</th>
                                <th className="px-5 py-3 font-medium">Category</th>
                                <th className="px-5 py-3 font-medium">Budget</th>
                                <th className="px-5 py-3 font-medium">Access</th>
                                <th className="px-5 py-3 font-medium w-32"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayMarketplaceLeads.map((lead: any) => {
                                const fmtBudget = (min: number, max: number) => {
                                  const fmt = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v.toLocaleString('en-IN')}`;
                                  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
                                  if (min) return `From ${fmt(min)}`;
                                  if (max) return `Up to ${fmt(max)}`;
                                  return '—';
                                };
                                const isThisUnlocked = isPremiumOrElite || userUnlocks.has(lead.id);
                                return (
                                  <tr key={lead.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-foreground">{lead.title}</td>
                                    <td className="px-5 py-3.5 text-muted-foreground">{lead.location || '—'}</td>
                                    <td className="px-5 py-3.5 text-muted-foreground">{lead.category || '—'}</td>
                                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{fmtBudget(lead.budget_min, lead.budget_max)}</td>
                                    <td className="px-5 py-3.5">
                                      {isThisUnlocked ? (
                                        <Badge className="text-[10px] border-0 gap-1" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                                          <Unlock className="h-3 w-3" /> Unlocked
                                        </Badge>
                                      ) : (
                                        <Badge className="text-[10px] border-0 gap-1" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                                          <Lock className="h-3 w-3" /> ₹99
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {isThisUnlocked ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs gap-1 border-white/10"
                                          onClick={() => navigate(`/lead/${lead.id}`)}
                                        >
                                          View Contact
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs gap-1.5"
                                          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
                                          onClick={() => navigate(`/lead/${lead.id}`)}
                                        >
                                          <Lock className="h-3 w-3" /> Unlock
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </>
              ) : (
                <TabsContent value="unlocked">
                  <Card className="bg-card/40 border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{userUnlocks.size}</span> unlocked lead{userUnlocks.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {userUnlocks.size === 0 ? (
                      <CardContent className="py-20 text-center">
                        <Unlock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                        <p className="text-muted-foreground mt-3 text-sm">No unlocked leads yet. Visit Browse Leads to unlock leads.</p>
                      </CardContent>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-sm text-muted-foreground uppercase bg-white/[0.02] border-b border-white/[0.06]">
                              <th className="px-5 py-3 font-medium">Title</th>
                              <th className="px-5 py-3 font-medium">Location</th>
                              <th className="px-5 py-3 font-medium">Category</th>
                              <th className="px-5 py-3 font-medium">Budget</th>
                              <th className="px-5 py-3 font-medium">Date Unlocked</th>
                              <th className="px-5 py-3 font-medium w-32"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketplaceLeads.filter(l => userUnlocks.has(l.id)).map((lead: any) => {
                              const fmtBudget = (min: number, max: number) => {
                                const fmt = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v.toLocaleString('en-IN')}`;
                                if (min && max) return `${fmt(min)} – ${fmt(max)}`;
                                if (min) return `From ${fmt(min)}`;
                                if (max) return `Up to ${fmt(max)}`;
                                return '—';
                              };
                              return (
                                <tr key={lead.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                  <td className="px-5 py-3.5 font-medium text-foreground">{lead.title}</td>
                                  <td className="px-5 py-3.5 text-muted-foreground">{lead.location || '—'}</td>
                                  <td className="px-5 py-3.5 text-muted-foreground">{lead.category || '—'}</td>
                                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{fmtBudget(lead.budget_min, lead.budget_max)}</td>
                                  <td className="px-5 py-3.5 text-muted-foreground">{new Date().toLocaleDateString('en-IN')}</td>
                                  <td className="px-5 py-3.5">
                                    {['Awarded', 'Cancelled', 'Archived'].includes(lead.status) ? (
                                      <Badge className="text-[10px] border-0 gap-1" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                                        <Lock className="h-3 w-3" /> {lead.status === 'Awarded' ? 'Project Awarded' : lead.status === 'Cancelled' ? 'Project Cancelled' : 'Project Closed'}
                                      </Badge>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 border-white/10"
                                        onClick={() => navigate(`/lead/${lead.id}`)}
                                      >
                                        View Details
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </section>

        {/* ── Lead Detail Modal ── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-white/10 text-foreground overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  className="text-[10px] border-0" 
                  style={{ 
                    background: selectedLead?.source_type === 'verified' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                    color: selectedLead?.source_type === 'verified' ? '#10B981' : '#3B82F6'
                  }}
                >
                  {selectedLead?.source_type === 'verified' ? 'Premium Lead' : 'Additional Lead'}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select
                    value={selectedLead?.status}
                    onValueChange={(val) => {
                      if (selectedLead) {
                        handleStatusChange(selectedLead.id, val);
                        setSelectedLead({ ...selectedLead, status: val });
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-7 w-32 text-xs border-white/10 px-2"
                      style={{ 
                        background: LEAD_STATUS_CONFIG[selectedLead?.status]?.bg, 
                        color: LEAD_STATUS_CONFIG[selectedLead?.status]?.color 
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_STATUS_OPTIONS.map((key) => {
                        const cfg = LEAD_STATUS_CONFIG[key];
                        return (
                          <SelectItem key={key} value={key}>
                            <span style={{ color: cfg?.color }}>{cfg?.label || key}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">{selectedLead?.requirement || selectedLead?.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Received on {selectedLead?.created_at ? new Date(selectedLead.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </DialogDescription>
              {(selectedLead?.lead_score || selectedLead?.intent_level) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <OpportunityScoreBadge score={selectedLead.lead_score} />
                  <IntentBadge level={selectedLead.intent_level} type={selectedLead.intent_type} />
                </div>
              )}
            </DialogHeader>

            {selectedLead?.company_summary && (
              <div className="mt-2 mb-4">
                <AISummaryPanel summary={selectedLead.company_summary} intentReasons={selectedLead.intent_reasons} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">Contact Details</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Phone Number</p>
                        <p className="text-sm font-medium">{selectedLead?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    {selectedLead?.phone && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy({ ...selectedLead, textToCopy: selectedLead.phone })}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Email Address</p>
                        <p className="text-sm font-medium">{selectedLead?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    {selectedLead?.email && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy({ ...selectedLead, textToCopy: selectedLead.email })}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Company Name</p>
                      <p className="text-sm font-medium">{selectedLead?.company || 'Not provided'}</p>
                    </div>
                  </div>

                  {selectedLead?.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Website</p>
                        <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                          {selectedLead.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">Requirement Info</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Location</p>
                      <p className="text-sm font-medium">{selectedLead?.location || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Category</p>
                      <p className="text-sm font-medium">{selectedLead?.category || 'General'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Budget Range</p>
                      <p className="text-sm font-medium">
                        {selectedLead?.budget_min || selectedLead?.budget_max 
                          ? `₹${selectedLead.budget_min?.toLocaleString('en-IN') || '0'} - ₹${selectedLead.budget_max?.toLocaleString('en-IN') || 'TBD'}`
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {selectedLead?.total_area && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Maximize className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Area / Specs</p>
                        <p className="text-sm font-medium">{selectedLead.total_area}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Full Description</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedLead?.notes || selectedLead?.requirement || "No detailed description available for this lead."}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
              <Button
                variant="outline"
                className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => {
                  setFeedbackLead(selectedLead);
                  setFeedbackDialogOpen(true);
                }}
              >
                <Sparkles className="h-4 w-4" /> Report Outcome
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                onClick={() => setIsOutreachModalOpen(true)}
              >
                <Wand2 className="h-4 w-4" /> Generate Outreach
              </Button>
              <Button onClick={() => handleCopy(selectedLead)} className="gap-2">
                <Copy className="h-4 w-4" /> Copy Details
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedLead && (
          <OutreachGeneratorModal 
            isOpen={isOutreachModalOpen}
            onClose={() => setIsOutreachModalOpen(false)}
            lead={{ 
              id: selectedLead.id, 
              company_name: selectedLead.company, 
              title: selectedLead.company, 
              email: selectedLead.email,
              phone: selectedLead.phone,
              niche: selectedLead.business_niche,
              location: selectedLead.location
            }}
            userProfile={profile}
          />
        )}

        {/* ── Feedback Questionnaire Dialog ── */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="max-w-md bg-card border-white/10 text-foreground overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Lead Outcome & Feedback
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Help us improve lead quality. Report the outcome of your discussions for {feedbackLead?.name || feedbackLead?.company || 'this lead'}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFeedbackSubmit} className="space-y-5 mt-4">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  What is the current outcome?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'converted_successfully', label: 'Converted Successfully', icon: '🏆', desc: 'Deal closed, contract signed (requires Admin approval)' },
                    { value: 'in_discussion', label: 'In Discussion', icon: '💬', desc: 'Still actively negotiating or communicating' },
                    { value: 'not_interested', label: 'Not Interested', icon: '❌', desc: 'Contact said they do not need this service' },
                    { value: 'wrong_lead', label: 'Wrong Lead', icon: '⚠️', desc: 'Invalid contact info or unrelated business requirement' },
                    { value: 'no_response', label: 'No Response', icon: '📭', desc: 'Called/emailed multiple times with no callback' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        feedbackType === opt.value
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-white/5 hover:border-white/10 hover:bg-white/[0.01] text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedbackType"
                        value={opt.value}
                        checked={feedbackType === opt.value}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-lg mt-0.5">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Share details about your experience, budget discussed, timeline, or contact comments..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingFeedback} className="gap-2">
                  {submittingFeedback && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Feedback
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
};

// ── Lead Table Component ──
interface LeadTableProps {
  leads: any[];
  loading: boolean;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onCopy: (lead: any) => void;
  onViewDetails: (lead: any) => void;
  copiedId: string | null;
  onExportCSV: () => void;
  onExportExcel: () => void;
  emptyIcon: React.ReactNode;
  emptyText: string;
  sourceLabel: string;
}

const LeadTable = ({
  leads,
  loading,
  onStatusChange,
  onCopy,
  onViewDetails,
  copiedId,
  onExportCSV,
  onExportExcel,
  emptyIcon,
  emptyText,
  sourceLabel,
}: LeadTableProps) => {
  if (loading) {
    return (
      <Card className="bg-card/40 border-white/5">
        <CardContent className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/40 border-white/5 overflow-hidden">
      {/* Export Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{leads.length}</span> lead{leads.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-white/10"
            onClick={onExportCSV}
            disabled={leads.length === 0}
          >
            <FileText className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-white/10"
            onClick={onExportExcel}
            disabled={leads.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <CardContent className="py-20 text-center">
          {emptyIcon}
          <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">{emptyText}</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-sm text-muted-foreground uppercase bg-white/[0.02] border-b border-white/[0.06]">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Requirement</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {leads.map((lead, idx) => {
                  const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => onViewDetails(lead)}
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">{lead.name}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{lead.phone || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{lead.email || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{lead.company || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{lead.location || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">{lead.requirement || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Select
                          value={lead.status}
                          onValueChange={(val) => onStatusChange(lead.id, val)}
                        >
                          <SelectTrigger
                            className="h-7 w-28 text-xs border-0 px-2"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent onClick={(e) => e.stopPropagation()}>
                            {USER_STATUS_OPTIONS.map((key) => {
                              const cfg = LEAD_STATUS_CONFIG[key];
                              return (
                                <SelectItem key={key} value={key}>
                                  <span style={{ color: cfg?.color }}>{cfg?.label || key}</span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-2 text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopy(lead);
                          }}
                        >
                          {copiedId === lead.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default CrmLeadsView;
