import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, Loader2, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, 
  XCircle, Brain, Sliders, Globe, Mail, Phone, Calendar, ArrowRight,
  TrendingUp, Activity, User, Info, Building2, Tag, Check, Award,
  Trash2, Archive, Star
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { classifyLead } from '@/lib/leadClassification';
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const AdminLeadVerificationTab = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [activeQueue, setActiveQueue] = useState<"pending" | "high_intent" | "suspicious" | "duplicates" | "rejected" | "verified">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [leadScores, setLeadScores] = useState<any | null>(null);
  const [leadRisk, setLeadRisk] = useState<any | null>(null);
  const [leadDuplicates, setLeadDuplicates] = useState<any[]>([]);
  
  // Quick Actions / Override states
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [overrideScoresOpen, setOverrideScoresOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [approveAllOpen, setApproveAllOpen] = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  
  // Manual score override states
  const [manualQuality, setManualQuality] = useState(70);
  const [manualIntent, setManualIntent] = useState(70);

  // Edit lead states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBudgetMin, setEditBudgetMin] = useState(0);
  const [editBudgetMax, setEditBudgetMax] = useState(0);

  // Expanded B2B fields edit states
  const [editNiche, setEditNiche] = useState("");
  const [editSubNiche, setEditSubNiche] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editLinkedinUrl, setEditLinkedinUrl] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editLeadStatus, setEditLeadStatus] = useState("active");
  const [editAdminNotes, setEditAdminNotes] = useState("");

  useEffect(() => {
    fetchLeads();
    setSelectedLead(null);
  }, [activeQueue, searchTerm]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from("leads").select("*, profiles!leads_seller_id_fkey(full_name, company_name, email, phone)");

      // Filter based on active queue
      if (activeQueue === "pending") {
        console.log('Fetching pending leads');
        query = query.in("verification_status", ["pending", "submitted", "PENDING"]);
      } else if (activeQueue === "high_intent") {
        query = query.in("verification_status", ["VERIFIED", "verified"]).gte("intent_score", 70);
      } else if (activeQueue === "suspicious") {
        query = query.in("verification_status", ["SUSPICIOUS", "suspicious", "flagged"]);
      } else if (activeQueue === "duplicates") {
        query = query.eq("duplicate_status", "duplicate");
      } else if (activeQueue === "rejected") {
        query = query.in("verification_status", ["REJECTED", "rejected"]);
      } else if (activeQueue === "verified") {
        query = query.in("verification_status", ["VERIFIED", "verified"]);
      }

      // Handle keyword search
      if (searchTerm.trim()) {
        const keyword = `%${searchTerm.trim()}%`;
        query = query.or(`title.ilike.${keyword},description.ilike.${keyword},company_name.ilike.${keyword},email.ilike.${keyword}`);
      }

      // Order by trust score or creation time
      query = query.order("created_at", { ascending: false }).limit(40);

      const { data, error } = await query;
      if (activeQueue === "pending") {
        console.log(data);
      }
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast({ title: "Failed to fetch leads", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    setApproveAllLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          verification_status: "VERIFIED",
          is_public: true,
          status: "Active",
          approved_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          approved_by: user?.id || null
        } as any)
        .in("verification_status", ["pending", "submitted", "PENDING"]);

      if (error) throw error;

      toast({ 
        title: "All Pending Leads Approved ✅", 
        description: "Bulk approval completed successfully." 
      });
      setApproveAllOpen(false);
      fetchLeads();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Bulk Approval Failed", description: err.message, variant: "destructive" });
    } finally {
      setApproveAllLoading(false);
    }
  };

  const selectLeadDetails = async (lead: any) => {
    setSelectedLead(lead);
    setManualQuality(lead.quality_score || 0);
    setManualIntent(lead.intent_score || 0);
    
    // Fetch details from auxiliary tables
    try {
      const [scoresRes, riskRes, dupRes] = await Promise.all([
        supabase.from("lead_scores").select("*").eq("lead_id", lead.id).maybeSingle(),
        supabase.from("lead_risk_analysis").select("*").eq("lead_id", lead.id).maybeSingle(),
        supabase.from("lead_duplicate_checks").select("*, matched:leads!lead_duplicate_checks_matched_lead_id_fkey(*)").eq("lead_id", lead.id)
      ]);

      setLeadScores(scoresRes.data || null);
      setLeadRisk(riskRes.data || null);
      setLeadDuplicates(dupRes.data || []);
    } catch (err: any) {
      console.warn("Failed to load details metrics:", err.message);
    }
  };

  const handleModeration = async (status: "VERIFIED" | "REJECTED" | "SUSPICIOUS", note?: string) => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const isVerified = status === "VERIFIED";
      const leadStatus = isVerified ? "Active" : "Archived";

      let updatePayload: any = { 
        verification_status: isVerified ? "verified" : status,
        is_verified: isVerified,
        status: leadStatus,
        reviewed_at: new Date().toISOString(),
        admin_notes: note || null
      };

      if (isVerified) {
        updatePayload.is_public = true;
        updatePayload.approved_at = new Date().toISOString();
        updatePayload.published_at = new Date().toISOString();
        updatePayload.approved_by = user?.id || null;
        console.log('Approving lead');
        console.log(selectedLead.id);
        console.log(updatePayload);
      }

      if (isVerified && (!selectedLead.industry_id || !selectedLead.subcategory_id)) {
        try {
          const [{ data: indData }, { data: subData }] = await Promise.all([
            supabase.from('industries').select('*').eq('is_active', true),
            supabase.from('subcategories').select('*').eq('is_active', true)
          ]);
          const result = await classifyLead(
            selectedLead.title || '',
            selectedLead.description || '',
            selectedLead.location || '',
            indData || [],
            subData || []
          );
          if (result.industry_id && result.confidence >= 0.5) {
             updatePayload.industry_id = result.industry_id;
             if (result.industry_name) updatePayload.industry = result.industry_name;
             updatePayload.ai_classification = result;
             if (result.subcategory_id) {
               updatePayload.subcategory_id = result.subcategory_id;
               if (result.subcategory_name) updatePayload.niche = result.subcategory_name;
             }
             if (result.tags?.length) updatePayload.relevance_tags = result.tags;
          }
        } catch (err) {
          console.warn("Auto-classification on approve failed:", err);
        }
      }

      const { error } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // --- PREMIUM CRM AUTO-ASSIGNMENT ---
      if (isVerified) {
        try {
          const finalIndustryId = updatePayload.industry_id || selectedLead.industry_id;
          if (finalIndustryId) {
            const { data: premiumUsers } = await supabase
              .from('profiles')
              .select('id, full_name, company_name, email')
              .eq('primary_industry_id', finalIndustryId)
              .in('subscription_plan', ['premium', 'elite']);

            if (premiumUsers && premiumUsers.length > 0) {
              const assignments = premiumUsers.map((u: any) => ({
                assigned_to: u.id,
                lead_id: selectedLead.id,
                source_type: 'auto_assignment',
                source_origin: 'admin_approval',
                name: selectedLead.external_contact_name || selectedLead.external_company_name || selectedLead.title || 'Unknown',
                company: selectedLead.external_company_name || null,
                email: selectedLead.external_email || null,
                phone: selectedLead.external_phone || null,
                location: selectedLead.location || '',
                requirement: selectedLead.title,
                industry_id: finalIndustryId,
                status: 'pending',
                notes: 'Automatically assigned based on premium industry match'
              }));
              await supabase.from('crm_leads').insert(assignments);
            }
          }
        } catch (autoAssignErr) {
          console.error("Auto CRM assignment failed:", autoAssignErr);
        }
      }

      // Log the verification action
      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: status === "VERIFIED" ? "approved" : status === "REJECTED" ? "rejected" : "flagged_suspicious",
        notes: note || "Verification review action completed"
      });

      toast({ 
        title: `Lead ${status.toLowerCase()} ✅`, 
        description: `Status successfully updated to ${status}.` 
      });

      setLeads(leads.filter(l => l.id !== selectedLead.id));
      setSelectedLead(null);
      setRejectDialogOpen(false);
      setRejectReason("");
      
      if (isVerified) {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      }
    } catch (err: any) {
      toast({ title: "Moderation failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualOverride = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const trust = Math.round((manualQuality + manualIntent - (selectedLead.risk_score || 0)) / 2);
      
      const { error } = await supabase
        .from("leads")
        .update({ 
          quality_score: manualQuality,
          intent_score: manualIntent,
          trust_score: Math.max(0, Math.min(100, trust))
        } as any)
        .eq("id", selectedLead.id);

      if (error) throw error;

      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: "manually_overridden",
        notes: `Overrode scores. Quality: ${manualQuality}, Intent: ${manualIntent}`
      });

      toast({ title: "Scores updated! 🎯" });
      setSelectedLead({ ...selectedLead, quality_score: manualQuality, intent_score: manualIntent, trust_score: trust });
      setOverrideScoresOpen(false);
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Override failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLead = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const tagsArray = editTags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      const updatePayload = {
        title: editTitle,
        description: editDescription,
        location: editLocation,
        budget_min: editBudgetMin || null,
        budget_max: editBudgetMax || null,
        niche: editNiche || null,
        sub_niche: editSubNiche || null,
        category: editCategory || null,
        industry: editIndustry || null,
        company_name: editCompanyName || null,
        external_company_name: editCompanyName || null,
        contact_name: editContactName || null,
        external_contact_name: editContactName || null,
        phone: editPhone || null,
        external_phone: editPhone || null,
        email: editEmail || null,
        external_email: editEmail || null,
        website: editWebsite || null,
        external_website: editWebsite || null,
        designation: editDesignation || null,
        whatsapp: editWhatsapp || null,
        linkedin_url: editLinkedinUrl || null,
        tags: tagsArray,
        featured: editFeatured,
        lead_status: editLeadStatus,
        admin_notes: editAdminNotes || null,
        status: editLeadStatus
      };

      const { error } = await supabase
        .from("leads")
        .update(updatePayload as any)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // Handle delete propagation to crm_leads if status set to deleted
      if (editLeadStatus === 'deleted') {
        await supabase
          .from("crm_leads")
          .delete()
          .ilike("notes", `%${selectedLead.id}%`);
      }

      // Log verification action
      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: "manually_edited",
        notes: `Edited B2B lead info parameters. Status: ${editLeadStatus}`
      });

      toast({ title: "Lead info updated ✅" });
      setSelectedLead({ 
        ...selectedLead, 
        ...updatePayload
      });
      setEditDialogOpen(false);
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Edit failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    if (!window.confirm("Are you sure you want to delete this lead? This will remove it from the marketplace, search, and CRM visibility while maintaining audit logs internally.")) return;
    setActionLoading(true);
    try {
      // 1. Soft-delete in leads
      const { error } = await supabase
        .from("leads")
        .update({
          lead_status: "deleted",
          status: "Archived",
          verification_status: "REJECTED",
          admin_notes: "Soft-deleted by Admin"
        } as any)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // 2. Remove from CRM leads visibility
      await supabase
        .from("crm_leads")
        .delete()
        .ilike("notes", `%${selectedLead.id}%`);

      // 3. Log verification action
      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: "deleted",
        notes: "Lead soft-deleted by Admin. Removed from CRM and marketplace."
      });

      toast({ title: "Lead soft-deleted successfully 🗑️" });
      setSelectedLead(null);
      setDeleteConfirmOpen(false);
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveLead = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          lead_status: "archived",
          status: "Archived"
        } as any)
        .eq("id", selectedLead.id);

      if (error) throw error;

      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: "archived",
        notes: "Lead archived by Admin"
      });

      toast({ title: "Lead archived successfully 📦" });
      setSelectedLead({ ...selectedLead, lead_status: "archived", status: "Archived" });
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Archive failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeature = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    const newFeatured = !selectedLead.featured;
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          featured: newFeatured
        } as any)
        .eq("id", selectedLead.id);

      if (error) throw error;

      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: newFeatured ? "featured" : "unfeatured",
        notes: newFeatured ? "Lead marked as Featured" : "Lead removed from Featured"
      });

      toast({ title: newFeatured ? "Lead featured! ★" : "Lead unfeatured" });
      setSelectedLead({ ...selectedLead, featured: newFeatured });
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Feature update failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergeDuplicate = async (dupId: string, matchedLeadId: string) => {
    setActionLoading(true);
    try {
      // 1. Mark duplicate check as merged
      await supabase
        .from("lead_duplicate_checks")
        .update({ status: "merged" })
        .eq("id", dupId);

      // 2. Clear duplicate status on the current lead
      await supabase
        .from("leads")
        .update({ duplicate_status: "none" } as any)
        .eq("id", selectedLead.id);

      // 3. Mark duplicate check logged
      await supabase.from("lead_verification_logs").insert({
        lead_id: selectedLead.id,
        action_type: "merged",
        notes: `Merged duplicate references with lead: ${matchedLeadId}`
      });

      toast({ title: "Leads merged successfully! 🔗" });
      setLeadDuplicates(leadDuplicates.filter(d => d.id !== dupId));
      setSelectedLead({ ...selectedLead, duplicate_status: "none" });
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Merge failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!selectedLead) return;
    setEditTitle(selectedLead.title || "");
    setEditDescription(selectedLead.description || "");
    setEditLocation(selectedLead.location || "");
    setEditBudgetMin(selectedLead.budget_min || 0);
    setEditBudgetMax(selectedLead.budget_max || 0);
    
    // B2B fields initializers
    setEditNiche(selectedLead.niche || "");
    setEditSubNiche(selectedLead.sub_niche || "");
    setEditCategory(selectedLead.category || "");
    setEditIndustry(selectedLead.industry || "");
    setEditCompanyName(selectedLead.company_name || selectedLead.external_company_name || "");
    setEditContactName(selectedLead.contact_name || selectedLead.external_contact_name || "");
    setEditPhone(selectedLead.phone || selectedLead.external_phone || "");
    setEditEmail(selectedLead.email || selectedLead.external_email || "");
    setEditWebsite(selectedLead.website || selectedLead.external_website || "");
    setEditDesignation(selectedLead.designation || "");
    setEditWhatsapp(selectedLead.whatsapp || "");
    setEditLinkedinUrl(selectedLead.linkedin_url || "");
    setEditTags(Array.isArray(selectedLead.tags) ? selectedLead.tags.join(", ") : "");
    setEditFeatured(selectedLead.featured || false);
    setEditLeadStatus(selectedLead.lead_status || selectedLead.status || "active");
    setEditAdminNotes(selectedLead.admin_notes || "");
    setEditDialogOpen(true);
  };

  const confirmDeleteLead = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    selectLeadDetails(lead).then(() => {
      setDeleteConfirmOpen(true);
    });
  };

  const openEditFromList = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    selectLeadDetails(lead).then(() => {
      // Need a slight timeout to ensure state has updated before opening
      setTimeout(() => {
        setEditTitle(lead.title || "");
        setEditDescription(lead.description || "");
        setEditLocation(lead.location || "");
        setEditBudgetMin(lead.budget_min || 0);
        setEditBudgetMax(lead.budget_max || 0);
        setEditNiche(lead.niche || "");
        setEditSubNiche(lead.sub_niche || "");
        setEditCategory(lead.category || "");
        setEditIndustry(lead.industry || "");
        setEditCompanyName(lead.company_name || lead.external_company_name || "");
        setEditContactName(lead.contact_name || lead.external_contact_name || "");
        setEditPhone(lead.phone || lead.external_phone || "");
        setEditEmail(lead.email || lead.external_email || "");
        setEditWebsite(lead.website || lead.external_website || "");
        setEditDesignation(lead.designation || "");
        setEditWhatsapp(lead.whatsapp || "");
        setEditLinkedinUrl(lead.linkedin_url || "");
        setEditTags(Array.isArray(lead.tags) ? lead.tags.join(", ") : "");
        setEditFeatured(lead.featured || false);
        setEditLeadStatus(lead.lead_status || lead.status || "active");
        setEditAdminNotes(lead.admin_notes || "");
        setEditDialogOpen(true);
      }, 100);
    });
  };

  // Helper styles based on score value
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 80) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (score >= 70) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getScoreProgressBar = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
      {/* ── LEFT: LEADS LISTING (7 Cols) ── */}
      <div className="lg:col-span-7 space-y-4">
        {/* Queue filter bar */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
          <button 
            onClick={() => setActiveQueue("pending")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "pending" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveQueue("high_intent")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "high_intent" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            High Intent
          </button>
          <button 
            onClick={() => setActiveQueue("suspicious")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "suspicious" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            Suspicious
          </button>
          <button 
            onClick={() => setActiveQueue("duplicates")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "duplicates" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            Duplicates
          </button>
          <button 
            onClick={() => setActiveQueue("rejected")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "rejected" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            Rejected
          </button>
          <button 
            onClick={() => setActiveQueue("verified")}
            className={`flex-1 min-w-[90px] py-2 text-xs font-medium rounded-lg transition-all ${activeQueue === "verified" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
          >
            Verified
          </button>
        </div>

        {/* Search & Actions header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by lead title, email, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/10"
            />
          </div>
          {activeQueue === "pending" && (
            <Button 
              onClick={() => setApproveAllOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shrink-0"
              disabled={leads.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve All Pending
            </Button>
          )}
        </div>

        {/* Leads card listing */}
        <div className="space-y-3 overflow-y-auto max-h-[700px] pr-1">
          {loading ? (
            <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : leads.length === 0 ? (
            <Card className="bg-card/30 border-white/5 border-dashed py-12 text-center">
              <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No leads match this filter criteria.</p>
            </Card>
          ) : (
            leads.map(lead => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <Card 
                  key={lead.id}
                  onClick={() => selectLeadDetails(lead)}
                  className={`bg-card/40 cursor-pointer border hover:bg-white/[0.02] transition-all hover:-translate-y-[1px] ${isSelected ? 'border-primary bg-white/[0.03]' : 'border-white/5'}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">{lead.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {lead.category && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {lead.category}</span>}
                          <span>•</span>
                          <span>Budget: ₹{lead.budget_min?.toLocaleString() || '0'} - ₹{lead.budget_max?.toLocaleString() || '—'}</span>
                          <span>•</span>
                          <span>{lead.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`capitalize shrink-0 text-[10px] ${
                        lead.verification_status === "VERIFIED" || lead.verification_status === "verified" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        lead.verification_status === "SUSPICIOUS" || lead.verification_status === "flagged" ? "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse" :
                        lead.verification_status === "REJECTED" ? "text-muted-foreground bg-white/5 border-white/10" :
                        "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      }`}>
                        {lead.verification_status || 'Pending'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Quality:</span>
                          <span className={`font-semibold ${lead.quality_score >= 90 ? 'text-emerald-400' : lead.quality_score >= 80 ? 'text-blue-400' : lead.quality_score >= 70 ? 'text-orange-400' : 'text-rose-400'}`}>
                            {lead.quality_score || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Intent:</span>
                          <span className={`font-semibold ${lead.intent_score >= 90 ? 'text-emerald-400' : lead.intent_score >= 80 ? 'text-blue-400' : lead.intent_score >= 70 ? 'text-orange-400' : 'text-rose-400'}`}>
                            {lead.intent_score || 0}
                          </span>
                        </div>
                        {lead.duplicate_status === 'duplicate' && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px] px-1 py-0">DUPLICATE</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground/60 text-[10px] mr-2">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-amber-500/80 hover:text-amber-500 hover:bg-amber-500/10"
                          onClick={(e) => openEditFromList(lead, e)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={(e) => confirmDeleteLead(lead, e)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: LEAD DETAILS PANEL (5 Cols) ── */}
      <div className="lg:col-span-5">
        {selectedLead ? (
          <div className="space-y-6 animate-scale-in">
            {/* Lead Quick Header Card */}
            <Card className="bg-card/50 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6"></div>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5" /> Automated Lead Intelligence
                    </span>
                    <Badge variant="outline" className="text-[10px]">ID: {selectedLead.id.substring(0, 8)}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground line-clamp-2">{selectedLead.title}</h3>
                </div>

                {/* Score meters grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Quality Score</p>
                    <p className={`text-xl font-bold mt-0.5 ${selectedLead.quality_score >= 90 ? 'text-emerald-400' : selectedLead.quality_score >= 80 ? 'text-blue-400' : selectedLead.quality_score >= 70 ? 'text-orange-400' : 'text-rose-400'}`}>
                      {selectedLead.quality_score || 0}
                    </p>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full ${getScoreProgressBar(selectedLead.quality_score || 0)}`} style={{ width: `${selectedLead.quality_score || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Intent Score</p>
                    <p className={`text-xl font-bold mt-0.5 ${selectedLead.intent_score >= 90 ? 'text-emerald-400' : selectedLead.intent_score >= 80 ? 'text-blue-400' : selectedLead.intent_score >= 70 ? 'text-orange-400' : 'text-rose-400'}`}>
                      {selectedLead.intent_score || 0}
                    </p>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full ${getScoreProgressBar(selectedLead.intent_score || 0)}`} style={{ width: `${selectedLead.intent_score || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Trust Score</p>
                    <p className={`text-xl font-bold mt-0.5 ${selectedLead.trust_score >= 90 ? 'text-emerald-400' : selectedLead.trust_score >= 80 ? 'text-blue-400' : selectedLead.trust_score >= 70 ? 'text-orange-400' : 'text-rose-400'}`}>
                      {selectedLead.trust_score || 0}
                    </p>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full ${getScoreProgressBar(selectedLead.trust_score || 0)}`} style={{ width: `${selectedLead.trust_score || 0}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Quote */}
                {selectedLead.ai_analysis && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs space-y-1.5">
                    <p className="font-semibold text-primary flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> AI Engine Analysis:</p>
                    <div className="space-y-1">
                      {selectedLead.ai_analysis.split(' | ').map((bullet: string, index: number) => {
                        const isWarning = bullet.startsWith('Warning:');
                        return (
                          <div key={index} className="flex items-start gap-1.5 text-muted-foreground">
                            {isWarning ? <AlertTriangle className="h-3 w-3 mt-0.5 text-rose-400 shrink-0" /> : <Check className="h-3 w-3 mt-0.5 text-emerald-400 shrink-0" />}
                            <span>{bullet.replace('Warning: ', '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit breakdown & parameters */}
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5" /> Scoring Factors Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {leadScores ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> Real Email</span>
                      <Badge variant="outline" className={leadScores.email_valid ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.email_valid ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Corporate Domain</span>
                      <Badge variant="outline" className={leadScores.corporate_domain ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.corporate_domain ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone Structure</span>
                      <Badge variant="outline" className={leadScores.phone_valid ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.phone_valid ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" /> Website Attached</span>
                      <Badge variant="outline" className={leadScores.website_exists ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.website_exists ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Timeline Spec</span>
                      <Badge variant="outline" className={leadScores.timeline_mentioned ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.timeline_mentioned ? "Mentioned" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                      <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Budget Spec</span>
                      <Badge variant="outline" className={leadScores.budget_mentioned ? "text-emerald-400 bg-emerald-500/10 border-0" : "text-rose-400 bg-rose-500/10 border-0"}>
                        {leadScores.budget_mentioned ? "Mentioned" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Scoring checklist record missing for this lead.</p>
                )}

                {/* Risk and safety block */}
                {leadRisk && (
                  <div className="p-3 rounded-lg bg-rose-500/[0.02] border border-rose-500/10 space-y-2">
                    <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" /> Threat & Risk Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${leadRisk.disposable_email ? 'bg-rose-500' : 'bg-white/20'}`}></span>
                        <span>Disposable Email: {leadRisk.disposable_email ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${leadRisk.fake_website ? 'bg-rose-500' : 'bg-white/20'}`}></span>
                        <span>Fake Domain: {leadRisk.fake_website ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${leadRisk.invalid_phone ? 'bg-rose-500' : 'bg-white/20'}`}></span>
                        <span>Suspicious Phone: {leadRisk.invalid_phone ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${leadRisk.risk_level === 'high' || leadRisk.risk_level === 'critical' ? 'bg-rose-500' : 'bg-white/20'}`}></span>
                        <span className="capitalize">Risk Category: {leadRisk.risk_level}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Duplicate matches warnings */}
                {leadDuplicates.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/[0.02] border border-amber-500/10 space-y-2">
                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Duplicate Submissions Warning
                    </p>
                    <div className="space-y-2">
                      {leadDuplicates.map((dup, index) => (
                        <div key={dup.id} className="flex justify-between items-center text-[10px] bg-white/[0.02] p-2 rounded border border-white/5 gap-2">
                          <div>
                            <span className="text-muted-foreground uppercase font-medium">Match on {dup.matching_field}:</span>
                            <p className="text-foreground mt-0.5 line-clamp-1">{dup.matched?.title || "Lead reference"}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9px] text-amber-400 border-amber-500/20 hover:bg-amber-500/10 px-2 flex shrink-0"
                            onClick={() => handleMergeDuplicate(dup.id, dup.matched_lead_id)}
                            disabled={actionLoading}
                          >
                            Merge Leads
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lead specifications review details */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Location:</span>
                    <span className="text-foreground font-medium">{selectedLead.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Category/Niche:</span>
                    <span className="text-foreground font-medium">{selectedLead.category || "Unassigned"}</span>
                  </div>
                  {selectedLead.description && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Detailed Description:</span>
                      <p className="text-foreground leading-relaxed p-2.5 rounded bg-white/[0.02] border border-white/5 select-all max-h-40 overflow-y-auto">
                        {selectedLead.description}
                      </p>
                    </div>
                  )}
                  {selectedLead.profiles && (
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[11px] text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1"><User className="h-3 w-3" /> Submitter Details:</p>
                      <p><strong>Name/Company:</strong> {selectedLead.profiles.company_name || selectedLead.profiles.full_name}</p>
                      <p><strong>Email:</strong> {selectedLead.profiles.email}</p>
                      {selectedLead.profiles.phone && <p><strong>Phone:</strong> {selectedLead.profiles.phone}</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions panel */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleModeration("VERIFIED")}
                  disabled={actionLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                </Button>
                <Button 
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1 gap-1.5 text-xs font-semibold"
                >
                  <XCircle className="h-4 w-4" /> Reject Lead
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleModeration("SUSPICIOUS")}
                  disabled={actionLoading}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Suspicious
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setOverrideScoresOpen(true)}
                  disabled={actionLoading}
                >
                  <Sliders className="h-3.5 w-3.5 text-blue-400" /> Override
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={openEditDialog}
                  disabled={actionLoading}
                >
                  <Sliders className="h-3.5 w-3.5 text-amber-400" /> Edit Info
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleArchiveLead}
                  disabled={actionLoading}
                >
                  <Archive className="h-3.5 w-3.5 text-indigo-400" /> Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleToggleFeature}
                  disabled={actionLoading}
                >
                  <Star className={`h-3.5 w-3.5 ${selectedLead.featured ? 'text-amber-400 fill-amber-400/20' : 'text-slate-400'}`} />
                  {selectedLead.featured ? "Featured" : "Feature"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="bg-card/20 border-white/5 border-dashed py-32 text-center flex flex-col justify-center items-center h-full min-h-[500px]">
            <Brain className="h-10 w-10 text-primary/40 mb-3 animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">Verification Console</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mt-1">Select a lead from the left pane to view deep quality metrics and AI audit logs.</p>
          </Card>
        )}
      </div>

      {/* ── DIALOG: SCORE OVERRIDES ── */}
      <Dialog open={overrideScoresOpen} onOpenChange={setOverrideScoresOpen}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Score Overrides</DialogTitle>
            <DialogDescription>Manually force score parameters to fix misaligned AI classifications.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Quality Score</span>
                <span>{manualQuality} / 100</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={manualQuality} 
                onChange={(e) => setManualQuality(parseInt(e.target.value))}
                className="w-full accent-primary bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Intent Score</span>
                <span>{manualIntent} / 100</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={manualIntent} 
                onChange={(e) => setManualIntent(parseInt(e.target.value))}
                className="w-full accent-primary bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10" onClick={() => setOverrideScoresOpen(false)}>Cancel</Button>
            <Button onClick={handleManualOverride} disabled={actionLoading}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: REJECT NOTE ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission Opportunity</DialogTitle>
            <DialogDescription>Explain to the submitter why their lead did not pass our quality audits.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="e.g. Disposable domain email detected and missing explicit budget description."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-white/5 border-white/10 resize-none h-24 text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleModeration("REJECTED", rejectReason)} disabled={actionLoading}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: EDIT LEAD INFO ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Override Lead Details</DialogTitle>
            <DialogDescription>Manually fix typographical errors, update contact info, niches, tags, or status parameters.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3 text-xs overflow-y-auto flex-1 pr-2 max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Opportunity Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Location</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Budget Min (₹)</label>
                <Input type="number" value={editBudgetMin} onChange={(e) => setEditBudgetMin(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Budget Max (₹)</label>
                <Input type="number" value={editBudgetMax} onChange={(e) => setEditBudgetMax(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Category (Marketplace tab)</label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. business" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Industry (Universal filter)</label>
                <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Marketing & Consulting" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Niche Keyword</label>
                <Input value={editNiche} onChange={(e) => setEditNiche(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Marketing Agency" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Sub-Niche Keyword</label>
                <Input value={editSubNiche} onChange={(e) => setEditSubNiche(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. SEO & Content" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Client Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Company Name</label>
                  <Input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Contact Person Name</label>
                  <Input value={editContactName} onChange={(e) => setEditContactName(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Designation</label>
                <Input value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Director" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Phone Number</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">WhatsApp</label>
                <Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Email Address</label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Website URL</label>
                <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="bg-white/5 border-white/10" placeholder="https://" />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">LinkedIn URL</label>
                <Input value={editLinkedinUrl} onChange={(e) => setEditLinkedinUrl(e.target.value)} className="bg-white/5 border-white/10" placeholder="https://" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-4">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Tags (Comma-separated list)</label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="bg-white/5 border-white/10" placeholder="SEO, Agency, Leads, B2B" />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Lead Visibility & Status</label>
                  <select 
                    value={editLeadStatus} 
                    onChange={(e) => setEditLeadStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm shadow-sm focus:outline-none text-foreground"
                  >
                    <option value="Planning" className="bg-card text-foreground">Planning</option>
                    <option value="Active" className="bg-card text-foreground">Active</option>
                    <option value="Negotiation" className="bg-card text-foreground">Negotiation</option>
                    <option value="Awarded" className="bg-card text-foreground">Awarded</option>
                    <option value="Cancelled" className="bg-card text-foreground">Cancelled</option>
                    <option value="Archived" className="bg-card text-foreground">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox" 
                    id="editFeatured" 
                    checked={editFeatured} 
                    onChange={(e) => setEditFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="editFeatured" className="text-muted-foreground font-semibold cursor-pointer select-none">
                    ★ Feature this lead on Marketplace
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Internal Admin Notes / Audit override details</label>
                <Textarea value={editAdminNotes} onChange={(e) => setEditAdminNotes(e.target.value)} rows={2} className="bg-white/5 border-white/10" />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Description / Requirement specifications</label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="bg-white/5 border-white/10" />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleEditLead} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: DELETE CONFIRMATION ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" /> Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This will remove it from the marketplace, search, and CRM visibility while maintaining audit logs internally.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mt-4 text-xs text-rose-200">
            <strong>Warning:</strong> This action is effectively irreversible from the user interface. Associated CRM leads will be deleted.
          </div>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteLead} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />} Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve All Pending Dialog */}
      <Dialog open={approveAllOpen} onOpenChange={setApproveAllOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              Bulk Approve Pending Leads
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-3">
              Are you sure you want to approve all currently pending leads? This will immediately make them live and visible on the marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
            Note: This action applies to all pending leads in the database, not just the ones visible on this page.
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setApproveAllOpen(false)} disabled={approveAllLoading}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleApproveAll} disabled={approveAllLoading}>
              {approveAllLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadVerificationTab;
