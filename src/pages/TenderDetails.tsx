import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, ArrowLeft, CheckCircle2, Loader2, Image as ImageIcon, Lock, Unlock, CreditCard, ShieldCheck, Zap, Phone, Mail, Globe, User, Sparkles, CalendarCheck, MessageSquare, Star, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { CompanyBadge } from "@/components/CompanyBadge";
import { payForLeadUnlock } from "@/lib/razorpay";
import ScheduleMeetingModal from "@/components/ScheduleMeetingModal";
import { OutreachGeneratorModal } from "@/components/OutreachGeneratorModal";
import { BADGE_CONFIG } from "@/types/crm";
import { trackEvent } from "@/utils/analytics";
import { calculateExtraLeadCost } from "@/lib/planEngine";


const TenderDetails = () => { 
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { businessProfile } = useBusinessProfile();
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const planLimits: Record<string, number> = {
    free: 0,
    basic: 15,
    premium: 35,
    elite: 60,
  };

  const currentPlan = profile?.subscription_plan || "free";
  const freeLimit = planLimits[currentPlan] ?? 0;
  const unlocksUsed = profile?.monthly_unlocks_used || 0;
  const UNLOCK_PRICE = 99;

  // Fetch credit balance for current profile
  const { data: creditBalance } = useQuery({
    queryKey: ["credit-balance", profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      const { data, error } = await supabase
        .from("credit_balances")
        .select("total_credits, used_credits, bonus_credits")
        .eq("user_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const remainingUnlocks = creditBalance 
    ? Math.max((creditBalance.total_credits + creditBalance.bonus_credits) - creditBalance.used_credits, 0)
    : Math.max(freeLimit - unlocksUsed, 0);

  // Auto-unlock for premium/elite users
  const isPremiumOrElite = ['premium', 'elite'].includes(currentPlan);
  const isBasicPlan = currentPlan === 'basic';

  // Fetch lead data
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*, profiles!leads_seller_id_fkey(id, user_id, full_name, company_name, email, phone)")
          .eq("id", id!)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn("Failed standard join query, falling back...", e);
      }

      // Fallback: fetch separately to prevent relation fkey joins crashes
      const { data: leadOnly, error: leadErr } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id!)
        .single();
      if (leadErr) throw leadErr;

      let profiles = null;
      if (leadOnly?.seller_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, company_name, email, phone")
          .eq("id", leadOnly.seller_id)
          .maybeSingle();
        profiles = prof;
      }
      return { ...leadOnly, profiles };
    },
    enabled: !!id,
  });

  // Fetch lead images
  const { data: leadImages } = useQuery({
    queryKey: ["lead-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_images")
        .select("*")
        .eq("lead_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if user has already unlocked this lead
  const { data: unlockData } = useQuery({
    queryKey: ["lead-unlock", id, profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const { data, error } = await supabase
        .from("lead_unlocks")
        .select("*")
        .eq("lead_id", id!)
        .eq("company_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!profile,
  });

  // Fetch lead badges
  const { data: leadBadges } = useQuery({
    queryKey: ["lead-badges", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("lead_badges")
        .select("*")
        .eq("lead_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (unlockData) {
      setIsUnlocked(true);
    }
  }, [unlockData]);

  // Auto-unlock for premium/elite when they visit the page
  useEffect(() => {
    if (lead && profile && isPremiumOrElite && !isUnlocked && profile.id !== lead.seller_id) {
      // Silently unlock
      const autoUnlock = async () => {
        try {
          const { error } = await supabase
            .from("lead_unlocks")
            .upsert({ lead_id: lead.id, company_id: profile.id, amount_paid: 0 }, { onConflict: 'lead_id,company_id' });
          if (!error) setIsUnlocked(true);
        } catch { /* ignore */ }
      };
      autoUnlock();
    }
  }, [lead, profile, isPremiumOrElite, isUnlocked]);

  // Track automated lead page view and opens metrics
  useEffect(() => {
    if (lead) {
      const trackViews = async () => {
        try {
          await supabase.rpc('increment_lead_metric', { lead_id: lead.id, metric_name: 'views' });
          await supabase.rpc('increment_lead_metric', { lead_id: lead.id, metric_name: 'opens' });
          trackEvent('lead_view', { lead_id: lead.id, title: lead.title });
        } catch (e) {
          console.warn("Failed to increment views/opens:", e);
        }
      };
      trackViews();
    }
  }, [lead]);

  const trackContact = async () => {
    if (!lead) return;
    try {
      await supabase.rpc('increment_lead_metric', { lead_id: lead.id, metric_name: 'interested' });
    } catch (e) {
      console.warn("Failed to track contact interest metric:", e);
    }
  };

  const handleSaveLead = async () => {
    if (!user?.id) return;
    setSavingBookmark(true);
    try {
      const { error } = await supabase.from('saved_leads').insert({ user_id: user.id, lead_id: id });
      if (error && error.code === '23505') {
        toast({ title: "Already Saved", description: "This opportunity is already in your Saved Leads." });
      } else if (error) {
        throw error;
      } else {
        await supabase.rpc('increment_lead_metric', { lead_id: id, metric_name: 'saves' });
        queryClient.setQueryData(["lead", id], (old: any) => old ? { ...old, total_saves: (old.total_saves || 0) + 1 } : old);
        trackEvent('lead_saved', { lead_id: id });
        toast({
          title: "Lead Saved! ⭐",
          description: "This opportunity has been successfully saved to your Saved Leads.",
        });
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleUnlock = async () => {
    if (!profile || !lead) return;

    const UNLOCK_PRICE = calculateExtraLeadCost(1);

    const planLimits: Record<string, number> = {
      free: 0,
      basic: 15,
      premium: 35,
      elite: 60,
    };
    const currentPlan = profile.subscription_plan || "free";
    const freeLimit = planLimits[currentPlan] ?? 0;

    let unlocksUsed = profile.monthly_unlocks_used || 0;
    let cycleStart = profile.unlock_cycle_start
      ? new Date(profile.unlock_cycle_start)
      : null;

    const now = new Date();

    // If no cycle start or subscription expired → reset cycle
    if (
      !cycleStart ||
      (profile.subscription_expires_at &&
        new Date(profile.subscription_expires_at) < now)
    ) {
      unlocksUsed = 0;
      await supabase
        .from("profiles")
        .update({
          monthly_unlocks_used: 0,
          unlock_cycle_start: now.toISOString(),
        })
        .eq("id", profile.id);
    }

    // Check if free unlock available (prioritizing credit balance if available)
    const remainingCredits = creditBalance
      ? Math.max((creditBalance.total_credits + creditBalance.bonus_credits) - creditBalance.used_credits, 0)
      : 0;
    const hasFreeUnlock = creditBalance ? (remainingCredits > 0) : (unlocksUsed < freeLimit);
    const unlockPrice = hasFreeUnlock ? 0 : calculateExtraLeadCost(1);

    setUnlocking(true);

    try {
      let paymentId: string | null = null;

      // If no free unlock available, trigger Razorpay payment
      if (!hasFreeUnlock) {
        try {
          trackEvent('payment_started', { type: 'lead_unlock', amount: UNLOCK_PRICE, lead_id: lead.id });
          const response = await payForLeadUnlock(
            lead.title,
            profile.email || user?.email,
            profile.full_name || profile.company_name,
            profile.phone,
          );
          paymentId = response.razorpay_payment_id;
          trackEvent('payment_success', { type: 'lead_unlock', amount: UNLOCK_PRICE, lead_id: lead.id });
        } catch (payErr: any) {
          // User cancelled or payment failed
          toast({
            title: "Payment Cancelled",
            description: payErr.message,
            variant: "destructive",
          });
          setUnlocking(false);
          return;
        }
      }

      // Insert unlock record — no limit on how many users can unlock
      const { error } = await supabase
        .from("lead_unlocks")
        .insert({
          lead_id: lead.id,
          company_id: profile.id,
          amount_paid: unlockPrice,
        });

      if (error) throw error;

      // Track payment in the unified payments table
      await supabase.from("payments").insert({
        user_id: profile.id,
        amount: unlockPrice,
        type: 'lead_unlock',
        lead_id: lead.id,
        status: 'success',
        razorpay_payment_id: paymentId,
      } as any);

      // Automated lead integration for the user's CRM
      const isExternalLead = lead.source_type === "admin_external";
      const sellerInfo = Array.isArray(lead.profiles) ? lead.profiles[0] : lead.profiles;
      
      await (supabase as any).from("crm_leads").insert({
        assigned_to: profile.id,
        source_type: 'auto',
        source_origin: 'marketplace_unlock',
        name: isExternalLead 
          ? (lead.external_contact_name || lead.external_company_name || lead.title) 
          : (sellerInfo?.full_name || sellerInfo?.company_name || 'Verified Client'),
        phone: isExternalLead ? lead.external_phone : sellerInfo?.phone,
        email: isExternalLead ? lead.external_email : sellerInfo?.email,
        company: isExternalLead ? lead.external_company_name : sellerInfo?.company_name,
        location: lead.location,
        requirement: lead.title,
        status: 'pending',
        notes: `Unlocked from marketplace. Marketplace Lead ID: ${lead.id}. Budget: ${lead.budget_min || 0} - ${lead.budget_max || 0}. Specs: ${lead.total_area || 'N/A'}. Description: ${lead.description || 'N/A'}`
      });

      // Increment interested count metric
      try {
        await supabase.rpc('increment_lead_metric', { lead_id: lead.id, metric_name: 'interested' });
      } catch (mErr) {
        console.warn("Failed to increment interested metric on unlock:", mErr);
      }

      // Create timeline entry
      await (supabase as any).from("activity_timeline").insert({
        user_id: profile.id,
        activity_type: 'lead_unlocked',
        title: `Unlocked Lead: ${lead.title}`,
        description: `Paid ₹${unlockPrice}`,
        related_id: lead.id,
        related_type: 'lead',
      });

      // If used free unlock and not using the trigger-backed creditBalance system → increment monthly_unlocks_used
      if (hasFreeUnlock && !creditBalance && freeLimit > 0) {
        await supabase
          .from("profiles")
          .update({
            monthly_unlocks_used: unlocksUsed + 1,
          })
          .eq("id", profile.id);
      }

      // Invalidate credit balance query to fetch new remaining credits
      queryClient.invalidateQueries({ queryKey: ["credit-balance", profile.id] });

      setIsUnlocked(true);

      toast({
        title: "Lead Unlocked! ✅",
        description: hasFreeUnlock
          ? "Used 1 subscription credit. Lead added to your CRM."
          : `₹${UNLOCK_PRICE} paid. Lead added to your CRM.`,
      });

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Not specified";
    const fmt = (v: number) => {
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(0)} L`;
      return `₹${v.toLocaleString("en-IN")}`;
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle>Lead Not Found</CardTitle>
              <CardDescription>This lead may have been removed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/tenders")} className="w-full">Back to Leads</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const sellerProfile = Array.isArray(lead.profiles)
  ? lead.profiles[0]
  : lead.profiles;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        {/* Header */}
        <section className="hero-gradient py-8">
          <div className="container mx-auto px-4">
            <Link to="/tenders">
              <Button variant="ghost" className="mb-4 gap-2 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" /> Back to Leads
              </Button>
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {lead.category && <Badge variant="outline" className="border-white/30 text-white">{lead.category}</Badge>}
                  <Badge
                    className={
                      lead.status === "active"
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-white"
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white tracking-tight uppercase">{lead.title}</h1>
                <p className="text-white/70 flex items-center gap-2 mt-1">
                  Posted by {lead.source_type === "admin_external"
                    ? (lead.external_company_name || "External Company")
                    : (sellerProfile?.company_name || sellerProfile?.full_name || "Buyer")}
                  {lead.source_type !== "admin_external" && <CompanyBadge profile={sellerProfile} />}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatBudget(lead.budget_min, lead.budget_max)}</p>
                <p className="text-sm text-white/70">Estimated Budget</p>
              </div>
            </div>
          </div>
        </section>

        {/* Images */}
        {leadImages && leadImages.length > 0 && (
          <section className="py-8 border-b">
            <div className="container mx-auto px-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" /> Attachments
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {leadImages.map((img) => (
                  <div key={img.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img src={img.image_url} alt="Lead attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left - Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Lead Details</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-medium">{lead.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Posted</p>
                          <p className="font-medium">{new Date(lead.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lead Type</p>
                          <p className="font-medium">{lead.project_type}</p>
                        </div>
                      </div>
                    </div>

                    {lead.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
                      </div>
                    )}

                    {lead.timeline && (
                      <div>
                        <h3 className="font-semibold mb-2">Timeline</h3>
                        <p className="text-muted-foreground">{lead.timeline}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Details — Locked / Unlocked */}
                {profile?.id !== lead.seller_id && (
                  <Card className="relative overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {isUnlocked ? (
                          <><Unlock className="h-5 w-5 text-emerald-500" /> Client Details</>
                        ) : (
                          <><Lock className="h-5 w-5 text-amber-500" /> Client Details — Locked</>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isUnlocked
                          ? "You unlocked this lead. You can now contact the client directly."
                          : "Unlock this lead to view contact details and connect directly."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isUnlocked ? (
                        /* ── UNLOCKED STATE ── */
                        (() => {
                          const isExternalLead = lead.source_type === "admin_external";
                          return (
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified Client
                              </p>
                              {isExternalLead ? (
                                <>
                                  <p><strong>Company:</strong> {lead.external_company_name || "—"}</p>
                                  {lead.external_contact_name && <p><strong>Contact Person:</strong> {lead.external_contact_name}</p>}
                                  <p><strong>Phone:</strong> {lead.external_phone
                                    ? <a href={`tel:${lead.external_phone}`} onClick={trackContact} className="text-primary hover:underline">{lead.external_phone}</a>
                                    : <span className="text-muted-foreground">Not available</span>}
                                  </p>
                                  <p><strong>Email:</strong> {lead.external_email
                                    ? <a href={`mailto:${lead.external_email}`} onClick={trackContact} className="text-primary hover:underline">{lead.external_email}</a>
                                    : <span className="text-muted-foreground">Not available</span>}
                                  </p>
                                  {lead.external_website && <p><strong>Website:</strong> <a href={lead.external_website.startsWith('http') ? lead.external_website : `https://${lead.external_website}`} onClick={trackContact} target="_blank" rel="noopener" className="text-primary hover:underline">{lead.external_website}</a></p>}
                                </>
                              ) : (
                                <>
                                  <p className="flex items-center gap-2"><strong>Company:</strong> {sellerProfile?.company_name || sellerProfile?.full_name || "—"} <CompanyBadge profile={sellerProfile} /></p>
                                  {sellerProfile?.full_name && sellerProfile?.company_name && (
                                    <p><strong>Contact Person:</strong> {sellerProfile.full_name}</p>
                                  )}
                                  <p><strong>Phone:</strong> {sellerProfile?.phone
                                    ? <a href={`tel:${sellerProfile.phone}`} onClick={trackContact} className="text-primary hover:underline">{sellerProfile.phone}</a>
                                    : <span className="text-muted-foreground">Not available</span>}
                                  </p>
                                  <p><strong>Email:</strong> {sellerProfile?.email
                                    ? <a href={`mailto:${sellerProfile?.email}`} onClick={trackContact} className="text-primary hover:underline">{sellerProfile.email}</a>
                                    : <span className="text-muted-foreground">Not available</span>}
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        /* ── LOCKED STATE — Blurred preview ── */
                        <>
                          <div className="relative p-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                            {/* Blurred dummy data */}
                            <div className="select-none pointer-events-none" style={{ filter: 'blur(6px)' }}>
                              <p className="text-sm"><strong>Company:</strong> Acme Solutions Pvt Ltd</p>
                              <p className="text-sm"><strong>Contact:</strong> Rajesh Kumar</p>
                              <p className="text-sm"><strong>Phone:</strong> +91 98XXX XXXXX</p>
                              <p className="text-sm"><strong>Email:</strong> contact@apexindustrial.in</p>
                            </div>
                            {/* Lock overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
                              <div className="text-center">
                                <Lock className="h-8 w-8 mx-auto mb-2 text-amber-500/70" />
                                <p className="text-sm font-medium text-foreground">Contact details hidden</p>
                                <p className="text-xs text-muted-foreground">Unlock to view</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
 
                {/* Business Details */}
                {(lead.company_size || lead.lead_source || lead.website || lead.decision_maker_name || lead.technical_notes) && (
                  <Card>
                    <CardHeader><CardTitle>Business Details</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {lead.company_size && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Company Size</p>
                            <p className="font-semibold">{lead.company_size}</p>
                          </div>
                        )}
                        {lead.lead_source && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Lead Source</p>
                            <p className="font-semibold">{lead.lead_source}</p>
                          </div>
                        )}
                        {lead.website && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Website</p>
                            <p className="font-semibold"><a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener" className="text-primary hover:underline">{lead.website}</a></p>
                          </div>
                        )}
                        {lead.decision_maker_name && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Decision Maker</p>
                            <p className="font-semibold">{lead.decision_maker_name}{lead.decision_maker_title ? ` — ${lead.decision_maker_title}` : ''}</p>
                          </div>
                        )}
                      </div>
                      {lead.technical_notes && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-1">Additional Notes</p>
                          <p className="text-sm text-muted-foreground">{lead.technical_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right - Unlock Lead CTA */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle className="font-display">Unlock This Lead</CardTitle>
                    <CardDescription>Get direct access to verified client contact details</CardDescription>
                  </CardHeader>
                  <CardContent>
                {profile?.id === lead.seller_id ? (

                  <div className="text-center space-y-3">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">This is your lead</p>
                      <p className="text-xs text-muted-foreground mt-1">You can view and manage it from your dashboard.</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>

                ) : isUnlocked ? (

                  <>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm font-semibold text-foreground">Lead Unlocked</p>
                        <p className="text-xs text-muted-foreground mt-1">Contact details are available in the left panel. This lead has also been added to your CRM.</p>
                      </div>

                      {/* Action buttons after unlock */}
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/workspace/crm")}>
                          View in CRM
                        </Button>
                        <Button
                          className="w-full gap-2"
                          onClick={() => {
                            trackContact();
                            setMeetingModalOpen(true);
                          }}
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                          <CalendarCheck className="h-4 w-4" /> Schedule Meeting
                        </Button>
                        {(() => {
                          const isExt = lead.source_type === "admin_external";
                          const phone = isExt ? lead.external_phone : sellerProfile?.phone;
                          const email = isExt ? lead.external_email : sellerProfile?.email;
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {phone && (
                                <Button
                                  variant="outline"
                                  className="gap-1.5 border-green-500/20 text-green-500 hover:bg-green-500/10 text-xs"
                                  onClick={() => {
                                    trackContact();
                                    const myCompanyName = businessProfile?.company_name || profile?.company_name || profile?.full_name || "our company";
                                    const waMessage = `Hi, I am reaching out from ${myCompanyName} regarding your requirement for "${lead.title}" posted on JAS Connect. We would love to discuss how we can help you with this.`;
                                    window.open(`https://wa.me/${String(phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`, '_blank');
                                  }}
                                >
                                  <Phone className="h-3.5 w-3.5" /> WhatsApp
                                </Button>
                              )}
                              {email && (
                                <Button
                                  variant="outline"
                                  className="gap-1.5 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 text-xs"
                                  onClick={() => {
                                    trackContact();
                                    window.open(`mailto:${email}`, '_blank');
                                  }}
                                >
                                  <Mail className="h-3.5 w-3.5" /> Email
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                        
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-white/10 mt-2"
                          onClick={handleSaveLead}
                          disabled={savingBookmark}
                        >
                          <Star className="h-4 w-4 text-amber-400" /> Save Opportunity
                        </Button>

                        <Button
                          className="w-full gap-2 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                          onClick={() => setIsOutreachModalOpen(true)}
                        >
                          <Wand2 className="h-4 w-4" /> Generate Outreach
                        </Button>
                      </div>
                    </div>

                    <OutreachGeneratorModal 
                      isOpen={isOutreachModalOpen}
                      onClose={() => setIsOutreachModalOpen(false)}
                      lead={lead}
                      userProfile={profile}
                      businessProfile={businessProfile}
                    />
                  </>

                ) : (

                  <div className="space-y-4">
                    {/* Flat ₹399 unlock price */}
                    <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                      <Lock className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-2xl font-bold text-foreground mb-1">₹{UNLOCK_PRICE}</p>
                      <p className="text-xs text-muted-foreground">One-time unlock fee</p>
                    </div>

                    {/* Credit info */}
                    {freeLimit > 0 && (
                      <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Subscription credits</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{remainingUnlocks} left</span>
                      </div>
                    )}

                    {remainingUnlocks > 0 && (
                      <p className="text-xs text-center text-emerald-500 flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" /> You can unlock this lead using 1 subscription credit — FREE!
                      </p>
                    )}
                    {remainingUnlocks <= 0 && freeLimit > 0 && (
                      <p className="text-xs text-center text-amber-500 flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" /> Quota exhausted. Additional leads cost ₹{calculateExtraLeadCost(1)} each.
                      </p>
                    )}

                    <Button
                      onClick={() => {
                        if (!profile) {
                          navigate("/auth");
                          return;
                        }
                        handleUnlock();
                      }}
                      disabled={unlocking}
                      className="w-full gap-2"
                      size="lg"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#0A0E1A',
                        boxShadow: '0 0 20px rgba(245,158,11,0.3)',
                      }}
                    >
                      {unlocking ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Unlocking...</>
                      ) : remainingUnlocks > 0 ? (
                        <><Unlock className="h-4 w-4" /> Unlock with Credit</>
                      ) : (
                        <><Unlock className="h-4 w-4" /> Unlock Lead — Pay ₹{UNLOCK_PRICE}</>
                      )}
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground">
                      Powered by Razorpay · Secure Payment
                    </p>

                    {/* Benefits */}
                    <div className="mt-2 space-y-2.5 pt-4 border-t border-white/[0.06]">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What you get</p>
                      <div className="flex items-start gap-2.5">
                        <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Direct Contact</p>
                          <p className="text-xs text-muted-foreground">Phone, email, and company details</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Verified Requirement</p>
                          <p className="text-xs text-muted-foreground">Admin-verified project details</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">No Middleman</p>
                          <p className="text-xs text-muted-foreground">Connect and negotiate directly</p>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-white/[0.06] mt-4">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-white/10"
                          onClick={handleSaveLead}
                          disabled={savingBookmark}
                        >
                          <Star className="h-4 w-4 text-amber-400" /> Save Opportunity
                        </Button>
                      </div>
                    </div>
                  </div>

                )}
              </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Schedule Meeting Modal */}
      {lead && profile && (
        <ScheduleMeetingModal
          isOpen={meetingModalOpen}
          onClose={() => setMeetingModalOpen(false)}
          bid={null}
          targetUserId={lead.seller_id}
          leadId={lead.id}
          leadTitle={lead.title}
          contactPhone={lead.source_type === 'admin_external' ? lead.external_phone : sellerProfile?.phone}
          contactEmail={lead.source_type === 'admin_external' ? lead.external_email : sellerProfile?.email}
          contactName={lead.source_type === 'admin_external' ? (lead.external_contact_name || lead.external_company_name) : (sellerProfile?.company_name || sellerProfile?.full_name)}
        />
      )}
    </div>
  );
};

export default TenderDetails;
