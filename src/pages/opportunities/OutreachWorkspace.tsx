import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Flame, Star, Phone, Mail, Clock, CalendarDays, CheckCircle2, ChevronRight, Users, Briefcase, Trophy, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadScoreModal } from "@/components/scoring/LeadScoreModal";

export default function OutreachWorkspace() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Score Modal State
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreModalLeadId, setScoreModalLeadId] = useState<string | null>(null);
  const [scoreModalCompanyName, setScoreModalCompanyName] = useState<string>("");

  // Fetch opportunities with accounts and contacts
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["outreach_opportunities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          accounts (
            id, name, industry, phone, website, hq_location
          )
        `)
        .eq("workspace_id", user.id)
        .eq("status", "open");

      if (error) throw error;

      // Fetch contacts for each account manually to avoid complex join issues
      const oppsWithContacts = await Promise.all(
        (data || []).map(async (opp: any) => {
          if (!opp.account_id) return { ...opp, contacts: [] };
          const { data: contacts } = await supabase
            .from("contacts")
            .select("*")
            .eq("account_id", opp.account_id);
          return { ...opp, contacts: contacts || [] };
        })
      );

      return oppsWithContacts;
    },
    enabled: !!user?.id,
  });

  // Mutate stage
  const updateStageMutation = useMutation({
    mutationFn: async ({ oppId, newStage }: { oppId: string; newStage: string }) => {
      setUpdatingId(oppId);
      const status = (newStage === "won" || newStage === "lost") ? newStage : "open";
      
      const { error } = await supabase
        .from("opportunities")
        .update({ stage: newStage, status })
        .eq("id", oppId);

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        workspace_id: user.id,
        opportunity_id: oppId,
        activity_type: "system",
        title: "Stage Updated",
        description: `Opportunity stage updated to ${newStage} in outreach workspace.`,
        created_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach_opportunities"] });
      toast({ title: "Stage updated successfully" });
      setUpdatingId(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to update stage", description: err.message, variant: "destructive" });
      setUpdatingId(null);
    }
  });

  // Mutate Lead Quality Stars
  const updateStarsMutation = useMutation({
    mutationFn: async ({ oppId, currentExplanation, rating }: { oppId: string; currentExplanation: any; rating: number }) => {
      const updatedExpl = {
        ...(typeof currentExplanation === "object" ? currentExplanation : {}),
        lead_quality_rating: rating,
      };

      const { error } = await supabase
        .from("opportunities")
        .update({ explanation: updatedExpl })
        .eq("id", oppId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach_opportunities"] });
      toast({ title: "Lead quality rating updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update rating", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="h-4 w-96 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Skeleton className="h-48 bg-white/5" />
          <Skeleton className="h-48 bg-white/5" />
        </div>
      </div>
    );
  }

  // Segmenting the opportunities by Tier
  const allOpps = opportunities || [];

  const t1Opps = allOpps.filter(o => !o.icp_tier || o.icp_tier === 'T1');
  const t2Opps = allOpps.filter(o => o.icp_tier === 'T2').sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
  const t3Opps = allOpps.filter(o => o.icp_tier === 'T3').sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));

  // 1. Highest Lead Score (sorted by lead_score desc) — OIE
  const highestPriority = [...t1Opps]
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
    .slice(0, 5);

  // 2. Top Contacts To Reach Now (Opportunities in outreach stage with contacts)
  const topContacts = t1Opps
    .filter(o => o.stage === "outreach" && o.contacts && o.contacts.length > 0)
    .slice(0, 5);

  // 3. Uncontacted Opportunities (in outreach stage, no recorded activity)
  const uncontacted = t1Opps
    .filter(o => o.stage === "outreach" && !o.last_contact_date)
    .slice(0, 5);

  // 4. Meeting Candidates (high lead score)
  const meetingCandidates = t1Opps
    .filter(o => (o.lead_score || 0) > 70)
    .slice(0, 5);

  const getStarRating = (opp: any) => {
    const expl = opp.explanation;
    if (expl && typeof expl === "object" && "lead_quality_rating" in expl) {
      return (expl as any).lead_quality_rating || 0;
    }
    return 0;
  };

  const handleStarClick = (opp: any, rating: number) => {
    updateStarsMutation.mutate({
      oppId: opp.id,
      currentExplanation: opp.explanation,
      rating
    });
  };

  const renderStars = (opp: any) => {
    const currentRating = getStarRating(opp);
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              handleStarClick(opp, star);
            }}
            className="hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={`h-4.5 w-4.5 ${
                star <= currentRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const OpportunityRow = ({ opp }: { opp: any }) => (
    <div
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className="p-4 rounded-lg bg-card/40 border border-white/5 hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
    >
      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{opp.title}</h4>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
            {opp.stage}
          </Badge>
          {opp.priority && (
            <Badge
              variant="outline"
              className={
                opp.priority.toLowerCase() === "critical"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : opp.priority.toLowerCase() === "high"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-white/5 text-muted-foreground border-white/5"
              }
            >
              {opp.priority}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{opp.accounts?.name || "No Associated Company"}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {opp.accounts?.hq_location && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {opp.accounts.hq_location}
            </span>
          )}
          {opp.lead_score != null && (
            <span 
              className="flex items-center gap-1 font-medium text-amber-400 cursor-pointer hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setScoreModalLeadId(opp.legacy_lead_id || opp.id); // fallback if legacy_lead_id not loaded
                setScoreModalCompanyName(opp.accounts?.name || "Unknown Company");
                setIsScoreModalOpen(true);
              }}
            >
              Lead Score: {opp.lead_score}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 self-start md:self-center ml-auto md:ml-0">
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Lead Quality</span>
          {renderStars(opp)}
        </div>

        <div className="flex items-center gap-3">
          <select
            disabled={updatingId === opp.id}
            value={opp.stage}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              updateStageMutation.mutate({ oppId: opp.id, newStage: e.target.value });
            }}
            className="bg-background border border-white/10 rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32"
          >
            <option value="discovery">Discovery</option>
            <option value="qualification">Qualification</option>
            <option value="outreach">Outreach</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" /> Outreach Workspace
        </h1>
        <p className="text-muted-foreground mt-1">
          Accelerate your outreach funnel. Prioritize high-value accounts, log communication signals, and audit quality scores.
        </p>
      </div>

      <Tabs defaultValue="t1" className="w-full space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="t1" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Tier 1 (Core ICP) <Badge variant="secondary" className="ml-2 bg-white/10">{t1Opps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="t2" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            Tier 2 (Adjacent) <Badge variant="secondary" className="ml-2 bg-white/10">{t2Opps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="t3" className="data-[state=active]:bg-muted/20 data-[state=active]:text-muted-foreground">
            Tier 3 (Nurture) <Badge variant="secondary" className="ml-2 bg-white/10">{t3Opps.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="t1" className="space-y-8 mt-0 focus:outline-none">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* SEGMENT 1: Highest Outreach Priority */}
            <Card className="bg-card/40 border-white/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="h-5 w-5 text-rose-500 animate-pulse" /> Tier 1 Priority Outreach
                </CardTitle>
                <CardDescription>Core ICP matches sorted by OIE priority algorithms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {highestPriority.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No pending high-priority outreach targets.</p>
                ) : (
                  highestPriority.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)
                )}
              </CardContent>
            </Card>

            {/* SEGMENT 2: Top Contacts To Reach */}
            <Card className="bg-card/40 border-white/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" /> Top Contacts To Reach Now
                </CardTitle>
                <CardDescription>Stakeholders linked to active opportunities in outreach stage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No contacts identified for immediate outreach.</p>
                ) : (
                  topContacts.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                      className="p-4 rounded-lg bg-card/40 border border-white/5 hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {opp.contacts?.[0]?.full_name || "Decision Maker"}
                        </h4>
                        <p className="text-xs text-muted-foreground">{opp.contacts?.[0]?.job_title || "Procurement Director"}</p>
                        <p className="text-xs text-primary">{opp.accounts?.name}</p>
                      </div>
                      <div className="flex gap-2.5">
                        {opp.contacts?.[0]?.phone && (
                          <a href={`tel:${opp.contacts[0].phone}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-md bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {opp.contacts?.[0]?.email && (
                          <a href={`mailto:${opp.contacts[0].email}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-md bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SEGMENT 3: Uncontacted Leads */}
            <Card className="bg-card/40 border-white/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" /> Uncontacted/Stale Targets
                </CardTitle>
                <CardDescription>Opps in outreach stage lacking communication logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uncontacted.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">All outreach targets have recent contact logged.</p>
                ) : (
                  uncontacted.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)
                )}
              </CardContent>
            </Card>

            {/* SEGMENT 4: Meeting Candidates */}
            <Card className="bg-card/40 border-white/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-400" /> Meeting Candidates
                </CardTitle>
                <CardDescription>High probability targets primed for commercial scope calls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {meetingCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No highly-qualified meeting candidates currently.</p>
                ) : (
                  meetingCandidates.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="t2" className="mt-0 focus:outline-none">
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-amber-400">Tier 2: Adjacent Opportunities</CardTitle>
              <CardDescription>
                These leads missed our exact Core ICP by 1 factor (e.g. adjacent industry or slightly smaller size) but may still be buyers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {t2Opps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No Tier 2 leads available.</p>
              ) : (
                t2Opps.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="t3" className="mt-0 focus:outline-none">
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Tier 3: Nurture & Review</CardTitle>
              <CardDescription>
                These leads failed multiple ICP qualification gates. Outreach is low priority, but they are retained for long-term nurture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {t3Opps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No Tier 3 leads available.</p>
              ) : (
                t3Opps.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LeadScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        leadId={scoreModalLeadId}
        companyName={scoreModalCompanyName}
      />
    </div>
  );
}
