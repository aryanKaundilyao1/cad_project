import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Search, Upload, Plus, UserCheck, ShieldCheck, Zap, CheckCircle2, AlertTriangle, Trash2, FileSpreadsheet, Mail, Phone, Globe, Linkedin, Shield, Ban, RefreshCw, FileText, User, HelpCircle } from "lucide-react";
import { PLAN_QUOTAS, LEAD_STATUS_CONFIG, getQuotaForPlan } from "@/types/crm";
import { parseCSV, exportToCSV } from "@/utils/exportUtils";
import * as XLSX from "xlsx";
import { classifyLead } from "@/lib/leadClassification";

const CRM_FIELDS = ["name", "phone", "email", "company", "location", "requirement", "website", "description", "category", "budget_min", "budget_max", "total_area"] as const;
const MARKETPLACE_FIELDS = ["title", "company_name", "contact_name", "designation", "email", "phone", "whatsapp", "linkedin_url", "website", "description", "location", "industry", "niche", "sub_niche", "business_type", "employee_count", "revenue_range", "funding_stage", "technologies", "country", "state", "city", "address", "tags", "source"] as const;

const AdminCrmTab = ({ adminProfile }: { adminProfile: any }) => {
  const { toast } = useToast();

  // User search
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userQuota, setUserQuota] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Business Profile & Usage States
  const [selectedUserBizProfile, setSelectedUserBizProfile] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>({
    leadsViewed: 0,
    leadsUnlocked: 0,
    exportsCount: 0,
    searchesPerformed: 0,
    aiSearchesPerformed: 0,
    conversationsCount: 0,
    feedbackCount: 0
  });
  const [internalNotes, setInternalNotes] = useState("");
  const [adminTags, setAdminTags] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");

  // Manual entry
  const [manualForm, setManualForm] = useState({ 
    name: "", phone: "", email: "", company: "", location: "", requirement: "",
    website: "", description: "", category: "", budget_min: "", budget_max: "", total_area: "" 
  });
  const [manualType, setManualType] = useState<"verified" | "auto">("verified");
  const [assignDirectly, setAssignDirectly] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Bulk upload
  const [bulkData, setBulkData] = useState<Record<string, string>[]>([]);
  const [bulkMapping, setBulkMapping] = useState<Record<string, string>>({});
  const [bulkType, setBulkType] = useState<"verified" | "auto">("verified");
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // All leads view
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignUserId, setReassignUserId] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);

  // Marketplace import
  const [mktData, setMktData] = useState<Record<string, string>[]>([]);
  const [mktMapping, setMktMapping] = useState<Record<string, string>>({});
  const [mktUploading, setMktUploading] = useState(false);
  const [mktImportResult, setMktImportResult] = useState<{ total: number; imported: number; skipped: number; failed: number } | null>(null);
  const mktFileRef = useRef<HTMLInputElement>(null);

  // New Advanced B2B Import panel states
  const [mktNicheDefault, setMktNicheDefault] = useState("SaaS");
  const [mktSubNicheDefault, setMktSubNicheDefault] = useState("");
  const [mktCategoryDefault, setMktCategoryDefault] = useState("SaaS");
  const [mktLocationDefault, setMktLocationDefault] = useState("India");
  const [mktSourceDefault, setMktSourceDefault] = useState("Admin Import");
  const [mktTagsDefault, setMktTagsDefault] = useState("B2B, Verified");
  
  const [dragActive, setDragActive] = useState(false);
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<{
    clean: Record<string, string>[];
    dbDuplicates: Record<string, string>[];
    localDuplicates: Record<string, string>[];
  } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [failedRows, setFailedRows] = useState<any[]>([]);

  // --- B2B EXCEL & CSV IMPORT HANDLERS ---
  const analyzeDuplicates = async (parsedData: Record<string, string>[], currentMapping: Record<string, string>) => {
    const emails = parsedData.map(r => r[currentMapping.email]).filter(Boolean).map(e => e.trim().toLowerCase());
    const phones = parsedData.map(r => r[currentMapping.phone]).filter(Boolean).map(p => p.trim());
    const websites = parsedData.map(r => r[currentMapping.website]).filter(Boolean).map(w => w.trim().toLowerCase());
    const linkedins = parsedData.map(r => r[currentMapping.linkedin_url]).filter(Boolean).map(l => l.trim().toLowerCase());

    let dbExisting: any[] = [];
    
    // Chunk queries to avoid URI Too Long errors (414) on large datasets
    const CHUNK_SIZE = 500;
    
    const fetchInChunks = async (items: string[], column: string) => {
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;
        try {
          const { data } = await supabase
            .from("leads")
            .select("email, phone, website, linkedin_url")
            .in(column, chunk);
          if (data) dbExisting = [...dbExisting, ...data];
        } catch (e) {
          console.warn(`Failed to check duplicates for ${column} chunk:`, e);
        }
      }
    };

    if (emails.length > 0) await fetchInChunks(emails, 'email');
    if (phones.length > 0) await fetchInChunks(phones, 'phone');
    if (websites.length > 0) await fetchInChunks(websites, 'website');
    if (linkedins.length > 0) await fetchInChunks(linkedins, 'linkedin_url');

    const dbEmails = new Set(dbExisting.map(d => d.email?.toLowerCase()).filter(Boolean));
    const dbPhones = new Set(dbExisting.map(d => d.phone).filter(Boolean));
    const dbWebsites = new Set(dbExisting.map(d => d.website?.toLowerCase()).filter(Boolean));
    const dbLinkedins = new Set(dbExisting.map(d => d.linkedin_url?.toLowerCase()).filter(Boolean));

    const clean: Record<string, string>[] = [];
    const dbDuplicates: Record<string, string>[] = [];
    const localDuplicates: Record<string, string>[] = [];
    const localSeen = new Set<string>();

    parsedData.forEach((row, index) => {
      const email = row[currentMapping.email]?.trim().toLowerCase() || "";
      const phone = row[currentMapping.phone]?.trim() || "";
      const website = row[currentMapping.website]?.trim().toLowerCase() || "";
      const linkedin = row[currentMapping.linkedin_url]?.trim().toLowerCase() || "";

      const emailMatch = email && dbEmails.has(email);
      const phoneMatch = phone && dbPhones.has(phone);
      const websiteMatch = website && dbWebsites.has(website);
      const linkedinMatch = linkedin && dbLinkedins.has(linkedin);

      if (emailMatch || phoneMatch || websiteMatch || linkedinMatch) {
        const reasons: string[] = [];
        if (emailMatch) reasons.push("Email");
        if (phoneMatch) reasons.push("Phone");
        if (websiteMatch) reasons.push("Website");
        if (linkedinMatch) reasons.push("LinkedIn");
        dbDuplicates.push({ ...row, __duplicateReason: reasons.join(", ") });
        return;
      }

      const localKey = `${email || '_'}|${phone || '_'}|${website || '_'}|${linkedin || '_'}`;
      const hasLocalKey = (email || phone || website || linkedin);
      if (hasLocalKey && localSeen.has(localKey)) {
        localDuplicates.push({ ...row, __duplicateReason: "Sheet duplicate" });
        return;
      }
      if (hasLocalKey) {
        localSeen.add(localKey);
      }
      clean.push(row);
    });

    setDuplicateAnalysis({ clean, dbDuplicates, localDuplicates });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        let parsed: Record<string, string>[] = [];
        if (isExcel) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsed = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        } else {
          const text = e.target?.result as string;
          parsed = parseCSV(text);
        }

        if (parsed.length === 0) {
          toast({ title: "Empty or invalid file", description: "No records detected in the sheet.", variant: "destructive" });
          return;
        }

        setMktData(parsed);
        setMktImportResult(null);
        setFailedRows([]);

        // Auto-map headers
        const csvHeaders = Object.keys(parsed[0]);
        const autoMap: Record<string, string> = {};
        MARKETPLACE_FIELDS.forEach((field) => {
          const match = csvHeaders.find((h) => 
            h.toLowerCase().replace(/[^a-z0-9]/g, "").includes(field.replace(/_/g, "")) ||
            field.replace(/_/g, "").includes(h.toLowerCase().replace(/[^a-z0-9]/g, ""))
          );
          if (match) autoMap[field] = match;
        });
        setMktMapping(autoMap);

        // Perform duplicate analysis
        await analyzeDuplicates(parsed, autoMap);
      } catch (err: any) {
        toast({ title: "Parsing Error", description: err.message, variant: "destructive" });
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const submitImport = async () => {
    if (mktUploading) return;
    setMktUploading(true);
    setImportProgress(0);
    setFailedRows([]);

    const cleanRows = duplicateAnalysis?.clean || mktData;
    if (cleanRows.length === 0) {
      toast({ title: "No leads to import", description: "All rows are duplicates or file is empty.", variant: "destructive" });
      setMktUploading(false);
      return;
    }

    // Fetch existing industries to match
    let existingIndustries: any[] = [];
    let existingSubcategories: any[] = [];
    try {
      const { data: indData } = await supabase.from("industries").select("*");
      existingIndustries = indData || [];
      const { data: subData } = await supabase.from("subcategories").select("*");
      existingSubcategories = subData || [];
    } catch (e) {
      console.warn("Failed to fetch industries/subcategories for classification:", e);
    }

    const matchIndustry = (nicheName: string) => {
      if (!nicheName) return null;
      const match = existingIndustries.find(ind => 
        ind.name.toLowerCase() === nicheName.toLowerCase() ||
        ind.slug.toLowerCase() === nicheName.toLowerCase().replace(/[^a-z0-9]/g, "-")
      );
      return match ? match.id : null;
    };

    // Create lead upload batch record in database first
    let batchId = null;
    try {
      const { data: batch, error: batchErr } = await supabase
        .from("lead_upload_batches")
        .insert({
          uploaded_by: adminProfile.id,
          file_name: mktFileRef.current?.files?.[0]?.name || "upload.csv",
          niche: mktNicheDefault,
          total_records: mktData.length,
          imported_records: 0,
          failed_records: 0
        })
        .select()
        .single();
      if (!batchErr && batch) {
        batchId = batch.id;
      }
    } catch (err) {
      console.warn("Failed to create lead upload batch record:", err);
    }

    const total = cleanRows.length;
    const chunkSize = 50;
    let importedCount = 0;
    let failedCount = 0;
    const failedList: any[] = [];

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = cleanRows.slice(i, i + chunkSize);
      setImportStatus(`Processing batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(total / chunkSize)}...`);
      
      const recordsToInsert = [];

      for (const row of chunk) {
        const nicheVal = row[mktMapping.niche] || mktNicheDefault;
        const subNicheVal = row[mktMapping.sub_niche] || mktSubNicheDefault;
        const titleVal = row[mktMapping.title] || row[mktMapping.company_name] || row[mktMapping.contact_name] || "B2B Lead";
        const descVal = row[mktMapping.description] || `B2B Lead in ${nicheVal}`;
        const locVal = row[mktMapping.location] || row[mktMapping.city] || row[mktMapping.state] || mktLocationDefault;
        
        let industryId = matchIndustry(nicheVal);
        let subcatId = null;
        let finalTags = row[mktMapping.tags] 
          ? row[mktMapping.tags].split(',').map((t: string) => t.trim()).filter(Boolean)
          : mktTagsDefault.split(',').map((t: string) => t.trim()).filter(Boolean);

        // Skip expensive AI classification for large bulk uploads to prevent freezing
        // or yield to the event loop every 10 rows
        if (!industryId && total <= 100) {
          try {
            if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0)); // Yield to prevent UI freeze
            const aiRes = await classifyLead(titleVal, descVal, locVal, existingIndustries, existingSubcategories);
            industryId = aiRes.industry_id;
            subcatId = aiRes.subcategory_id;
            if (aiRes.tags && aiRes.tags.length > 0 && (!row[mktMapping.tags])) {
              finalTags = aiRes.tags;
            }
          } catch (e) {
            console.warn("AI Classification failed for lead, falling back:", e);
          }
        }
        
        if (!industryId) {
          industryId = matchIndustry(mktCategoryDefault);
        }

        // Add yield every 50 records to keep UI responsive
        if (recordsToInsert.length % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        recordsToInsert.push({
          title: titleVal,
          description: descVal,
          location: locVal,
          category: row[mktMapping.category] || mktCategoryDefault,
          company_name: row[mktMapping.company_name] || null,
          contact_name: row[mktMapping.contact_name] || null,
          designation: row[mktMapping.designation] || null,
          email: row[mktMapping.email] || null,
          phone: row[mktMapping.phone] || null,
          whatsapp: row[mktMapping.whatsapp] || null,
          linkedin_url: row[mktMapping.linkedin_url] || null,
          website: row[mktMapping.website] || null,
          industry: nicheVal,
          niche: nicheVal,
          sub_niche: subNicheVal,
          business_type: row[mktMapping.business_type] || null,
          employee_count: row[mktMapping.employee_count] || null,
          revenue_range: row[mktMapping.revenue_range] || null,
          funding_stage: row[mktMapping.funding_stage] || null,
          technologies: row[mktMapping.technologies] || null,
          country: row[mktMapping.country] || mktLocationDefault,
          state: row[mktMapping.state] || null,
          city: row[mktMapping.city] || null,
          address: row[mktMapping.address] || null,
          tags: finalTags,
          source: row[mktMapping.source] || mktSourceDefault,
          source_file: mktFileRef.current?.files?.[0]?.name || "upload.csv",
          seller_id: adminProfile.id,
          source_type: "admin_external",
          verification_status: "VERIFIED",
          is_verified: true,
          status: "Active",
          ai_relevance_score: 85.0,
          uploaded_by: adminProfile.id,
          upload_batch_id: batchId,
          lead_status: "active",
          industry_id: industryId,
          subcategory_id: subcatId
        });
      }

      const { error } = await supabase.from("leads").insert(recordsToInsert);
      
      if (error) {
        console.error("Batch insertion failed, retrying row-by-row:", error);
        for (const record of recordsToInsert) {
          const { error: rowError } = await supabase.from("leads").insert(record);
          if (rowError) {
            failedCount++;
            failedList.push({ ...record, error_description: rowError.message });
          } else {
            importedCount++;
          }
        }
      } else {
        importedCount += recordsToInsert.length;
      }

      setImportProgress(Math.round(((i + chunk.length) / total) * 100));
    }

    // Update batch details in database
    if (batchId) {
      await supabase
        .from("lead_upload_batches")
        .update({
          imported_records: importedCount,
          failed_records: failedCount
        })
        .eq("id", batchId);
    }

    setMktImportResult({
      total: mktData.length,
      imported: importedCount,
      skipped: (duplicateAnalysis?.dbDuplicates.length || 0) + (duplicateAnalysis?.localDuplicates.length || 0),
      failed: failedCount
    });

    setFailedRows(failedList);
    setMktUploading(false);
    setImportProgress(100);
    setImportStatus("Import finished!");

    toast({
      title: "Import Session Finished 🚀",
      description: `Imported: ${importedCount} B2B leads. Skipped: ${(duplicateAnalysis?.dbDuplicates.length || 0) + (duplicateAnalysis?.localDuplicates.length || 0)} duplicates. Failed: ${failedCount}.`,
      variant: failedCount > 0 ? "destructive" : "default"
    });
  };

  // ── Search Users ──
  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearching(true);
    try {
      const q = userSearch.trim();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`email.ilike.%${q}%,company_name.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10);
      if (error) {
        console.error("Search error:", error);
        toast({ title: "Search Error", description: error.message, variant: "destructive" });
      }
      setSearchResults(data || []);
    } catch (err: any) {
      console.error("Search failed:", err);
      toast({ title: "Search Failed", description: err.message, variant: "destructive" });
    }
    setSearching(false);
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleAllLeads = () => {
    if (selectedLeadIds.length === allLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(allLeads.map(l => l.id));
    }
  };

  const handleBulkReassign = async () => {
    if (!reassignUserId || selectedLeadIds.length === 0) return;
    setReassigning(true);
    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({ assigned_to: reassignUserId })
        .in("id", selectedLeadIds);
      
      if (error) throw error;
      
      toast({ title: "Leads Reassigned Successfully" });
      setReassignModalOpen(false);
      setSelectedLeadIds([]);
      loadAllLeads(); // refresh the list
    } catch (err: any) {
      toast({ title: "Reassign Failed", description: err.message, variant: "destructive" });
    } finally {
      setReassigning(false);
    }
  };

  const selectUser = async (user: any) => {
    setSelectedUser(user);
    setInternalNotes(user.admin_notes || "");
    setAdminTags(user.admin_tags || "");
    setSelectedPlan(user.subscription_plan || "free");

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: q } = await (supabase as any).from("quota_tracking").select("*").eq("user_id", user.id).eq("month", monthStart).maybeSingle();
    setUserQuota(q);

    // Fetch Business Profile
    try {
      const { data: bp, error: bpErr } = await supabase
        .from("business_profiles")
        .select("*, industries:industry_id(name), subcategories:subcategory_id(name)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!bpErr && bp) {
        setSelectedUserBizProfile(bp);
      } else {
        setSelectedUserBizProfile(null);
      }
    } catch (e) {
      console.warn("Failed to fetch business profile:", e);
      setSelectedUserBizProfile(null);
    }

    // Fetch Usage Stats
    try {
      const { count: leadsViewed } = await supabase
        .from("user_activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "view_lead");

      const { count: leadsUnlocked } = await supabase
        .from("lead_unlocks")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user.id);

      const { count: exportsCount } = await supabase
        .from("user_activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "export");

      const { count: searchesPerformed } = await supabase
        .from("user_activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "search");

      const { count: aiSearchesPerformed } = await supabase
        .from("user_activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "ai_search");

      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const { count: fdbCount } = await (supabase as any)
        .from("conversion_reviews")
        .select("*", { count: "exact", head: true })
        .eq("submitted_by", user.id);

      setUsageStats({
        leadsViewed: leadsViewed || 0,
        leadsUnlocked: leadsUnlocked || 0,
        exportsCount: exportsCount || 0,
        searchesPerformed: searchesPerformed || 0,
        aiSearchesPerformed: aiSearchesPerformed || 0,
        conversationsCount: msgCount || 0,
        feedbackCount: fdbCount || 0
      });
    } catch (e) {
      console.warn("Failed fetching usage stats:", e);
      setUsageStats({
        leadsViewed: 0,
        leadsUnlocked: 0,
        exportsCount: 0,
        searchesPerformed: 0,
        aiSearchesPerformed: 0,
        conversationsCount: 0,
        feedbackCount: 0
      });
    }
  };

  const handleSaveAdminData = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          admin_notes: internalNotes,
          admin_tags: adminTags
        })
        .eq("id", selectedUser.id);
      if (error) throw error;
      
      setSelectedUser((prev: any) => ({ ...prev, admin_notes: internalNotes, admin_tags: adminTags }));
      toast({ title: "Admin Notes & Tags Saved" });
    } catch (err: any) {
      toast({ title: "Error Saving Data", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleVerified = async () => {
    if (!selectedUser) return;
    const newStatus = !selectedUser.is_verified;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: newStatus })
        .eq("id", selectedUser.id);
      if (error) throw error;
      
      setSelectedUser((prev: any) => ({ ...prev, is_verified: newStatus }));
      toast({ title: newStatus ? "User Marked Verified" : "User Verification Removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleSuspended = async () => {
    if (!selectedUser) return;
    const newStatus = !selectedUser.is_suspended;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: newStatus })
        .eq("id", selectedUser.id);
      if (error) throw error;
      
      setSelectedUser((prev: any) => ({ ...prev, is_suspended: newStatus }));
      toast({ title: newStatus ? "Account Suspended" : "Account Unsuspended", variant: newStatus ? "destructive" : "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResetCredits = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ monthly_unlocks_used: 0 })
        .eq("id", selectedUser.id);
      if (error) throw error;
      
      setUserQuota((prev: any) => prev ? { ...prev, delivered: 0 } : { delivered: 0 });
      toast({ title: "Monthly Credits Reset Successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleChangePlan = async (plan: string) => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_plan: plan })
        .eq("id", selectedUser.id);
      if (error) throw error;
      
      setSelectedUser((prev: any) => ({ ...prev, subscription_plan: plan }));
      setSelectedPlan(plan);
      
      const quota = getQuotaForPlan(plan);
      setUserQuota((prev: any) => prev ? { ...prev, quota_limit: quota } : { delivered: 0, quota_limit: quota });
      
      toast({ title: `Subscription Plan Updated to ${plan}` });
    } catch (err: any) {
      toast({ title: "Error Changing Plan", description: err.message, variant: "destructive" });
    }
  };

  // ── Manual Lead Entry ──
  const submitManualLead = async () => {
    if (!selectedUser) { toast({ title: "Select a user first", variant: "destructive" }); return; }
    if (!manualForm.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }

    const plan = selectedUser.subscription_plan || "free";
    const quota = getQuotaForPlan(plan);

    if (manualType === "verified" && userQuota && userQuota.delivered >= quota) {
      toast({ title: "Quota Exceeded", description: `${selectedUser.company_name || selectedUser.full_name} has reached their monthly verified lead limit (${quota}).`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data: lead, error } = await (supabase as any).from("crm_leads").insert({
      assigned_to: selectedUser.id,
      assigned_by: adminProfile.id,
      source_type: manualType,
      source_origin: "admin_manual",
      ...manualForm,
      status: "pending",
      budget_min: manualForm.budget_min ? parseInt(manualForm.budget_min) : null,
      budget_max: manualForm.budget_max ? parseInt(manualForm.budget_max) : null,
    }).select().single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }

    // Update quota tracking for verified leads
    if (manualType === "verified") {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      await (supabase as any).from("quota_tracking").upsert({
        user_id: selectedUser.id, month: monthStart, plan_name: plan, quota_limit: quota,
        delivered: (userQuota?.delivered || 0) + 1, extra_purchased: userQuota?.extra_purchased || 0,
      }, { onConflict: "user_id,month" });
      setUserQuota((prev: any) => prev ? { ...prev, delivered: prev.delivered + 1 } : { delivered: 1, quota_limit: quota });
    }

    // Log
    await (supabase as any).from("lead_logs").insert({
      crm_lead_id: lead.id, action: "created", performed_by: adminProfile.id,
      details: { source_type: manualType, assigned_to: selectedUser.id },
    });

    toast({ title: "Lead Added ✅", description: `Assigned to ${selectedUser.company_name || selectedUser.full_name}` });
    setManualForm({ 
      name: "", phone: "", email: "", company: "", location: "", requirement: "",
      website: "", description: "", category: "", budget_min: "", budget_max: "", total_area: "" 
    });
    setSubmitting(false);
  };

  // ── Bulk Upload ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { toast({ title: "Empty or invalid CSV", variant: "destructive" }); return; }
      setBulkData(parsed);
      // Auto-map columns
      const csvHeaders = Object.keys(parsed[0]);
      const autoMap: Record<string, string> = {};
      CRM_FIELDS.forEach((field) => {
        const match = csvHeaders.find((h) => h.toLowerCase().replace(/[^a-z]/g, "").includes(field));
        if (match) autoMap[field] = match;
      });
      setBulkMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const submitBulk = async () => {
    if (!selectedUser) { toast({ title: "Select a user first", variant: "destructive" }); return; }
    
    // Improved Validation - Make sure we have at least one valid row mapped
    if (bulkData.length === 0) { toast({ title: "No data to import", variant: "destructive" }); return; }

    const plan = selectedUser.subscription_plan || "free";
    const quota = getQuotaForPlan(plan);
    const verifiedCount = bulkType === "verified" ? bulkData.length : 0;

    if (bulkType === "verified" && userQuota && (userQuota.delivered + verifiedCount) > quota) {
      toast({ title: "Quota Exceeded", description: `Bulk import of ${verifiedCount} verified leads would exceed quota (${quota}). Delivered so far: ${userQuota.delivered}.`, variant: "destructive" });
      return;
    }

    setBulkUploading(true);
    const rows = bulkData.map((row) => {
      // Find fallback names or default if name isn't explicitly mapped
      const rowName = bulkMapping.name ? row[bulkMapping.name] : row["name"] || row["Name"] || row["Contact"] || row["title"] || "Unknown Lead";
      const rowCompany = bulkMapping.company ? row[bulkMapping.company] : row["company"] || row["Company"] || row["Client"] || null;
      
      return {
        assigned_to: selectedUser.id, assigned_by: adminProfile.id,
        source_type: bulkType, source_origin: "admin_bulk", status: "new",
        name: rowName,
        phone: bulkMapping.phone ? row[bulkMapping.phone] : row["phone"] || row["Phone"] || null,
        email: bulkMapping.email ? row[bulkMapping.email] : row["email"] || row["Email"] || null,
        company: rowCompany,
        location: bulkMapping.location ? row[bulkMapping.location] : row["location"] || row["Location"] || null,
        requirement: bulkMapping.requirement ? row[bulkMapping.requirement] : row["requirement"] || row["Requirement"] || null,
      };
    });

    // Make sure we filter out rows with literally no contact/name data if strict mapping failed
    const validRows = rows.filter(r => r.name !== "Unknown Lead" || r.phone || r.email || r.company);
    if (validRows.length === 0) {
      toast({ title: "No valid rows found", description: "Could not map any usable data. Please map columns.", variant: "destructive" });
      setBulkUploading(false);
      return;
    }

    const { data: inserted, error } = await (supabase as any).from("crm_leads").insert(validRows).select();
    if (error) { toast({ title: "Bulk Upload Error", description: error.message, variant: "destructive" }); setBulkUploading(false); return; }

    if (bulkType === "verified") {
      const actualVerifiedInserted = inserted?.length || 0;
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      await (supabase as any).from("quota_tracking").upsert({
        user_id: selectedUser.id, month: monthStart, plan_name: plan, quota_limit: quota,
        delivered: (userQuota?.delivered || 0) + actualVerifiedInserted, extra_purchased: userQuota?.extra_purchased || 0,
      }, { onConflict: "user_id,month" });
      
      // Update local state quota properly to reflect counter changes immediately
      setUserQuota((prev: any) => prev ? { ...prev, delivered: prev.delivered + actualVerifiedInserted } : { delivered: actualVerifiedInserted, quota_limit: quota });
    }

    // Log bulk
    for (const lead of (inserted || [])) {
      await (supabase as any).from("lead_logs").insert({
        crm_lead_id: lead.id, action: "bulk_imported", performed_by: adminProfile.id,
        details: { source_type: bulkType, batch_size: validRows.length },
      });
    }

    toast({ title: `${validRows.length} Leads Imported ✅` });
    setBulkData([]); setBulkMapping({}); setBulkUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Load All Leads ──
  const loadAllLeads = async () => {
    setLeadsLoading(true);
    const { data } = await (supabase as any).from("crm_leads").select("*, profiles!crm_leads_assigned_to_fkey(full_name, company_name, email)").order("created_at", { ascending: false }).limit(200);
    setAllLeads(data || []);
    setLeadsLoading(false);
    setLeadsLoaded(true);
  };

  const deleteLead = async (id: string) => {
    await (supabase as any).from("crm_leads").delete().eq("id", id);
    setAllLeads((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Lead Deleted" });
  };

  const userPlan = selectedUser?.subscription_plan || "free";
  const userQuotaLimit = getQuotaForPlan(userPlan);
  const userDelivered = userQuota?.delivered || 0;
  const userRemaining = Math.max(0, userQuotaLimit - userDelivered);

  return (
    <div className="space-y-6">
      {/* ── USER SEARCH ── */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" /> User Search & Quota View</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search by email, company, or name..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchUsers()} className="bg-white/[0.03] border-white/[0.08]" />
            <Button onClick={searchUsers} disabled={searching}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}</Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => selectUser(u)} className={`text-left p-3 rounded-lg border transition-all ${selectedUser?.id === u.id ? "border-primary/40 bg-primary/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                  <p className="font-medium text-sm text-foreground">{u.company_name || u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.subscription_plan || "free"}</p>
                </button>
              ))}
            </div>
          )}

          {/* Selected User Dashboard */}
          {selectedUser && (
            <div className="mt-6 border border-primary/20 bg-background/60 rounded-xl p-6 space-y-6">
              
              {/* Header section */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {selectedUser.company_name || selectedUser.full_name || "No Name Provided"}
                      {selectedUser.is_verified && <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedUser.is_suspended ? (
                    <Badge variant="destructive" className="px-2.5 py-1 text-xs gap-1.5">
                      <Ban className="h-3 w-3" /> Suspended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="px-2.5 py-1 text-xs gap-1.5 border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  )}
                  <Badge className="px-2.5 py-1 text-xs uppercase" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}>
                    {selectedUser.subscription_plan || "free"} Plan
                  </Badge>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: Basic Info & Usage Data */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" /> Basic Information
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="text-foreground font-medium">{selectedUser.full_name || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground font-medium">{selectedUser.email || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground font-medium">{selectedUser.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Company Name:</span>
                        <span className="text-foreground font-medium">{selectedUser.company_name || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Designation:</span>
                        <span className="text-foreground font-medium text-right max-w-[150px] truncate">{selectedUser.business_type || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Website:</span>
                        {selectedUserBizProfile?.onboarding_data?.website || selectedUserBizProfile?.onboarding_data?.companyWebsite ? (
                          <a 
                            href={selectedUserBizProfile?.onboarding_data?.website || selectedUserBizProfile?.onboarding_data?.companyWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-medium text-right max-w-[150px] truncate flex items-center gap-1"
                          >
                            <Globe className="h-3.5 w-3.5 shrink-0" /> Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">LinkedIn:</span>
                        {selectedUserBizProfile?.onboarding_data?.linkedin || selectedUserBizProfile?.onboarding_data?.linkedIn ? (
                          <a 
                            href={selectedUserBizProfile?.onboarding_data?.linkedin || selectedUserBizProfile?.onboarding_data?.linkedIn} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-medium text-right max-w-[150px] truncate flex items-center gap-1"
                          >
                            <Linkedin className="h-3.5 w-3.5 shrink-0" /> Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.03]">
                        <span className="text-muted-foreground">Signup Date:</span>
                        <span className="text-foreground font-medium">
                          {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Monthly Lead Quota
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-base font-bold text-foreground">{userQuotaLimit}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Limit</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-base font-bold text-emerald-400">{userDelivered}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Used</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-base font-bold text-blue-400">{userRemaining}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Left</p>
                      </div>
                    </div>

                    <Progress value={userQuotaLimit > 0 ? (userDelivered / userQuotaLimit) * 100 : 0} className="h-1.5" />
                  </div>

                  {/* Usage Stats */}
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Usage & Analytics
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">Leads Viewed</span>
                        <span className="text-lg font-bold text-foreground">{usageStats.leadsViewed}</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">Leads Unlocked</span>
                        <span className="text-lg font-bold text-emerald-400">{usageStats.leadsUnlocked}</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">Exports Done</span>
                        <span className="text-lg font-bold text-foreground">{usageStats.exportsCount}</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">Searches Run</span>
                        <span className="text-lg font-bold text-foreground">{usageStats.searchesPerformed}</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">AI Searches Run</span>
                        <span className="text-lg font-bold text-purple-400">{usageStats.aiSearchesPerformed}</span>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/[0.03] rounded">
                        <span className="text-[10px] text-muted-foreground block uppercase">Chat Messages</span>
                        <span className="text-lg font-bold text-blue-400">{usageStats.conversationsCount}</span>
                      </div>
                      <div className="p-2 col-span-2 bg-white/[0.01] border border-white/[0.03] rounded flex justify-between items-center px-3">
                        <span className="text-[10px] text-muted-foreground uppercase">Feedback Submitted</span>
                        <span className="text-sm font-bold text-amber-500">{usageStats.feedbackCount}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* COLUMN 2: Business Profile Information */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 h-full">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" /> Business Onboarding Profile
                    </h4>

                    {selectedUserBizProfile ? (
                      <div className="space-y-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground block">Niche/Primary Industry:</span>
                          <span className="font-semibold text-foreground">{selectedUserBizProfile.industries?.name || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Subcategory/Sub-Niche:</span>
                          <span className="font-semibold text-foreground">{selectedUserBizProfile.subcategories?.name || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Services / Products Offered:</span>
                          <p className="text-xs text-muted-foreground bg-white/[0.01] border border-white/[0.03] rounded p-2 mt-1 leading-relaxed max-h-24 overflow-y-auto">
                            {selectedUserBizProfile.services_products || "No services/products configured."}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Ideal Customer Profile (ICP):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(selectedUserBizProfile.ideal_lead_types) && selectedUserBizProfile.ideal_lead_types.length > 0 ? (
                              selectedUserBizProfile.ideal_lead_types.map((type: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] border-white/10 bg-white/[0.02] text-foreground">{type}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Target Industries:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(selectedUserBizProfile.target_audience) && selectedUserBizProfile.target_audience.length > 0 ? (
                              selectedUserBizProfile.target_audience.map((ind: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] border-white/10 bg-white/[0.02] text-foreground">{ind}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Target Geography:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(selectedUserBizProfile.target_geography) && selectedUserBizProfile.target_geography.length > 0 ? (
                              selectedUserBizProfile.target_geography.map((geo: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] border-white/10 bg-white/[0.02] text-foreground">{geo}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Team Size:</span>
                          <span className="font-semibold text-foreground">{selectedUserBizProfile.team_size || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Lead Requirement / Preference:</span>
                          <span className="font-semibold text-foreground">{selectedUserBizProfile.monthly_lead_requirement || "—"}</span>
                        </div>

                        {/* Extra fields from onboarding JSON */}
                        {selectedUserBizProfile.onboarding_data && (
                          <div className="space-y-3 pt-3 border-t border-white/[0.04]">
                            <div>
                              <span className="text-xs text-muted-foreground block">Keywords:</span>
                              <span className="text-xs font-semibold text-foreground">{selectedUserBizProfile.onboarding_data.keywords || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">Competitors:</span>
                              <span className="text-xs font-semibold text-foreground">{selectedUserBizProfile.onboarding_data.competitors || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">Technologies:</span>
                              <span className="text-xs font-semibold text-foreground">{selectedUserBizProfile.onboarding_data.technologies || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">Sales Team Size:</span>
                              <span className="text-xs font-semibold text-foreground">{selectedUserBizProfile.onboarding_data.salesTeamSize || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">Lead Sources Preferred:</span>
                              <span className="text-xs font-semibold text-foreground">
                                {Array.isArray(selectedUserBizProfile.onboarding_data.leadSources) 
                                  ? selectedUserBizProfile.onboarding_data.leadSources.join(', ') 
                                  : selectedUserBizProfile.onboarding_data.leadSources || "—"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-lg p-4">
                        <AlertTriangle className="h-6 w-6 text-amber-500/50 mb-2" />
                        <p className="text-xs font-semibold text-foreground">No Business Profile Found</p>
                        <p className="text-[10px] text-muted-foreground mt-1">This user hasn't completed onboarding or has a partial account.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: Admin Actions & Notes */}
                <div className="space-y-6">
                  
                  {/* Notes & Tags Editor */}
                  <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Internal Admin Notes & Tags
                    </h4>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase">Internal Tags (Comma-separated)</Label>
                      <Input 
                        placeholder="e.g. vip, cold, high-value" 
                        value={adminTags} 
                        onChange={(e) => setAdminTags(e.target.value)} 
                        className="bg-white/[0.03] border-white/[0.08] text-sm h-9" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase">Internal Notes (Visible only to admins)</Label>
                      <Textarea 
                        placeholder="Type confidential admin notes here..." 
                        value={internalNotes} 
                        onChange={(e) => setInternalNotes(e.target.value)} 
                        className="bg-white/[0.03] border-white/[0.08] text-sm min-h-[100px] resize-none" 
                      />
                    </div>

                    <Button onClick={handleSaveAdminData} className="w-full text-xs h-9 bg-primary text-primary-foreground font-semibold hover:bg-primary/95">
                      Save Notes & Tags
                    </Button>
                  </div>

                  {/* Status Modifiers */}
                  <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" /> System Controls
                    </h4>

                    <div className="space-y-3 text-xs">
                      
                      {/* Plan Changer */}
                      <div className="space-y-1.5">
                        <Label className="text-[9px] text-muted-foreground uppercase">Update Plan Tier</Label>
                        <Select value={selectedPlan} onValueChange={handleChangePlan}>
                          <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-xs h-8">
                            <SelectValue placeholder="Choose a plan" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/10">
                            <SelectItem value="free">Free Plan</SelectItem>
                            <SelectItem value="basic">Basic Plan</SelectItem>
                            <SelectItem value="premium">Premium Plan</SelectItem>
                            <SelectItem value="elite">Elite Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {/* Verification Button */}
                        <Button 
                          variant="outline" 
                          onClick={handleToggleVerified}
                          className={`w-full justify-start text-left h-8 gap-2 border-white/5 hover:bg-white/[0.04] text-xs`}
                        >
                          <ShieldCheck className={`h-4 w-4 shrink-0 ${selectedUser.is_verified ? "text-amber-500" : "text-emerald-500"}`} />
                          {selectedUser.is_verified ? "Revoke Verification" : "Mark Account Verified"}
                        </Button>

                        {/* Suspension Button */}
                        <Button 
                          variant="outline" 
                          onClick={handleToggleSuspended}
                          className={`w-full justify-start text-left h-8 gap-2 border-white/5 hover:bg-red-500/10 text-xs ${selectedUser.is_suspended ? "text-emerald-400" : "text-red-400"}`}
                        >
                          <Ban className="h-4 w-4 shrink-0" />
                          {selectedUser.is_suspended ? "Unsuspend Account" : "Suspend Account"}
                        </Button>

                        {/* Reset Credits */}
                        <Button 
                          variant="outline" 
                          onClick={handleResetCredits}
                          className="w-full justify-start text-left h-8 gap-2 border-white/5 hover:bg-white/[0.04] text-xs"
                        >
                          <RefreshCw className="h-4 w-4 shrink-0 text-blue-400 animate-hover" />
                          Reset Monthly Credits
                        </Button>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MANUAL ENTRY ── */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Manual Lead Entry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contact Group */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Contact Info</h4>
              <div className="space-y-2">
                <div><Label className="text-[10px]">Name</Label><Input value={manualForm.name} onChange={(e) => setManualForm(p => ({...p, name: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                <div><Label className="text-[10px]">Phone</Label><Input value={manualForm.phone} onChange={(e) => setManualForm(p => ({...p, phone: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                <div><Label className="text-[10px]">Email</Label><Input value={manualForm.email} onChange={(e) => setManualForm(p => ({...p, email: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                <div><Label className="text-[10px]">Company</Label><Input value={manualForm.company} onChange={(e) => setManualForm(p => ({...p, company: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                <div><Label className="text-[10px]">Website</Label><Input value={manualForm.website} onChange={(e) => setManualForm(p => ({...p, website: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
              </div>
            </div>

            {/* Requirement Group */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Requirement</h4>
              <div className="space-y-2">
                <div><Label className="text-[10px]">Requirement Title</Label><Input value={manualForm.requirement} onChange={(e) => setManualForm(p => ({...p, requirement: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                <div><Label className="text-[10px]">Full Description</Label><Textarea value={manualForm.description} onChange={(e) => setManualForm(p => ({...p, description: e.target.value}))} className="h-20 bg-white/[0.03] text-xs" /></div>
                <div><Label className="text-[10px]">Location</Label><Input value={manualForm.location} onChange={(e) => setManualForm(p => ({...p, location: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
              </div>
            </div>

            {/* Specs Group */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Specifications</h4>
              <div className="space-y-2">
                <div><Label className="text-[10px]">Category</Label><Input value={manualForm.category} onChange={(e) => setManualForm(p => ({...p, category: e.target.value}))} className="h-8 bg-white/[0.03]" placeholder="e.g. Warehouse, Factory" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">Budget Min (₹)</Label><Input type="number" value={manualForm.budget_min} onChange={(e) => setManualForm(p => ({...p, budget_min: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                  <div><Label className="text-[10px]">Budget Max (₹)</Label><Input type="number" value={manualForm.budget_max} onChange={(e) => setManualForm(p => ({...p, budget_max: e.target.value}))} className="h-8 bg-white/[0.03]" /></div>
                </div>
                <div><Label className="text-[10px]">Total Area / Specs</Label><Input value={manualForm.total_area} onChange={(e) => setManualForm(p => ({...p, total_area: e.target.value}))} className="h-8 bg-white/[0.03]" placeholder="e.g. 50,000 sq ft" /></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Section:</Label>
              <div className="flex gap-1">
                <Button size="sm" variant={manualType === "verified" ? "default" : "outline"} className="h-7 text-xs gap-1 px-3" onClick={() => setManualType("verified")}><ShieldCheck className="h-3 w-3" /> Premium</Button>
                <Button size="sm" variant={manualType === "auto" ? "default" : "outline"} className="h-7 text-xs gap-1 px-3" onClick={() => setManualType("auto")}><Zap className="h-3 w-3" /> Additional</Button>
              </div>
            </div>
            <Button onClick={submitManualLead} disabled={submitting || !selectedUser} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Lead
            </Button>
          </div>
          {!selectedUser && <p className="text-xs text-amber-500">⚠ Search and select a user above first</p>}
        </CardContent>
      </Card>

      {/* ── BULK UPLOAD ── */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="w-5 h-5" /> Bulk CSV Upload</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input type="file" accept=".csv" ref={fileRef} onChange={handleFileUpload} className="bg-white/[0.03] border-white/[0.08] max-w-xs" />
            <div className="flex gap-1">
              <Button size="sm" variant={bulkType === "verified" ? "default" : "outline"} className="h-7 text-xs gap-1" onClick={() => setBulkType("verified")}><ShieldCheck className="h-3 w-3" /> Verified</Button>
              <Button size="sm" variant={bulkType === "auto" ? "default" : "outline"} className="h-7 text-xs gap-1" onClick={() => setBulkType("auto")}><Zap className="h-3 w-3" /> Auto</Button>
            </div>
          </div>

          {bulkData.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Column Mapping ({bulkData.length} rows detected)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CRM_FIELDS.map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs capitalize">{field}</Label>
                      <Select value={bulkMapping[field] || ""} onValueChange={(v) => setBulkMapping((p) => ({ ...p, [field]: v }))}>
                        <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Select column" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(bulkData[0]).map((col) => (<SelectItem key={col} value={col}>{col}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="overflow-x-auto max-h-48 rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead><tr className="bg-white/[0.03]">{Object.keys(bulkData[0]).map((h) => <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>)}</tr></thead>
                  <tbody>{bulkData.slice(0, 5).map((row, i) => (<tr key={i} className="border-t border-white/[0.03]">{Object.values(row).map((v, j) => <td key={j} className="px-3 py-1.5 text-muted-foreground">{v}</td>)}</tr>))}</tbody>
                </table>
                {bulkData.length > 5 && <p className="text-xs text-muted-foreground text-center py-2">...and {bulkData.length - 5} more rows</p>}
              </div>

              <Button onClick={submitBulk} disabled={bulkUploading || !selectedUser} className="gap-2">
                {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import {bulkData.length} Leads
              </Button>
            </>
          )}
          {!selectedUser ? (
            <div className="relative max-w-md">
              <p className="text-xs text-amber-500 mb-2">⚠ Search and select a user to assign leads to:</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, company, or email..."
                  value={userSearch}
                  onFocus={() => { if (!searchResults.length) searchUsers(); }}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  className="bg-white/[0.03] border-white/[0.08]"
                />
                <Button 
                  size="sm" 
                  onClick={searchUsers} 
                  disabled={searching}
                  className="absolute right-1 top-1 h-7"
                >
                  {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 hover:bg-white/5 cursor-pointer flex flex-col border-b border-white/5 last:border-0"
                      onClick={() => { selectUser(u); setSearchResults([]); }}
                    >
                      <span className="text-sm font-medium">{u.full_name || u.company_name || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">{u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-primary/10 border border-primary/20 max-w-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Assigning to {selectedUser.company_name || selectedUser.full_name}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setSelectedUser(null); setUserSearch(""); }}>Change</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── B2B MULTI-NICHE IMPORT PANEL ── */}
      <Card className="bg-card/40 border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> JAS CONNECT Lead Intelligence Import Panel
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Upload CSV or Excel B2B leads. Configured directories will automatically feed the public intelligence marketplace and matching CRM niches.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase text-[10px]">
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Default Upload Batch Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Niche</Label>
              <Select value={mktNicheDefault} onValueChange={setMktNicheDefault}>
                <SelectTrigger className="h-9 text-xs bg-white/[0.02] border-white/[0.08]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Marketing Agencies">Marketing Agencies</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Solar Energy">Solar Energy</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Sub-Niche</Label>
              <Input 
                value={mktSubNicheDefault} 
                onChange={(e) => setMktSubNicheDefault(e.target.value)} 
                placeholder="e.g. PEB, SEO, Civil" 
                className="h-9 text-xs bg-white/[0.02] border-white/[0.08]" 
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Category</Label>
              <Select value={mktCategoryDefault} onValueChange={setMktCategoryDefault}>
                <SelectTrigger className="h-9 text-xs bg-white/[0.02] border-white/[0.08]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Marketing Agencies">Marketing Agencies</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Region</Label>
              <Input 
                value={mktLocationDefault} 
                onChange={(e) => setMktLocationDefault(e.target.value)} 
                placeholder="e.g. Dubai, Bangalore" 
                className="h-9 text-xs bg-white/[0.02] border-white/[0.08]" 
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Source</Label>
              <Input 
                value={mktSourceDefault} 
                onChange={(e) => setMktSourceDefault(e.target.value)} 
                placeholder="e.g. Apollo, ZoomInfo" 
                className="h-9 text-xs bg-white/[0.02] border-white/[0.08]" 
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-muted-foreground">Default Tags</Label>
              <Input 
                value={mktTagsDefault} 
                onChange={(e) => setMktTagsDefault(e.target.value)} 
                placeholder="Comma separated" 
                className="h-9 text-xs bg-white/[0.02] border-white/[0.08]" 
              />
            </div>
          </div>

          {/* Drag and Drop Uploader */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => mktFileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              dragActive 
                ? "border-primary bg-primary/5 text-primary scale-[0.99]" 
                : "border-white/10 hover:border-primary/45 bg-white/[0.01] hover:bg-white/[0.02] text-muted-foreground hover:text-foreground"
            }`}
          >
            <Input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              ref={mktFileRef} 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }} 
            />
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-primary/80" />
            </div>
            <p className="text-sm font-semibold mb-1">
              Drag & Drop lead data sheet here, or <span className="text-primary hover:underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground/80 max-w-xs">
              Supports CSV and Excel (.xlsx, .xls) directories. Automatic duplicate checking will run instantly.
            </p>
          </div>

          {/* Mapped Headers and Duplicate Detection Analysis */}
          {mktData.length > 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {/* Duplicate Analysis Stat Box */}
              {duplicateAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-muted-foreground font-medium">Clean B2B Leads (Ready)</p>
                    </div>
                    <p className="text-xl font-bold mt-1 text-emerald-400">{duplicateAnalysis.clean.length} rows</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-muted-foreground font-medium">Database Duplicates (Skip)</p>
                    </div>
                    <p className="text-xl font-bold mt-1 text-amber-400">{duplicateAnalysis.dbDuplicates.length} rows</p>
                  </div>

                  <div className="p-3 rounded-lg border border-purple-500/10 bg-purple-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <p className="text-xs text-muted-foreground font-medium">Local Sheet Duplicates (Skip)</p>
                    </div>
                    <p className="text-xl font-bold mt-1 text-purple-400">{duplicateAnalysis.localDuplicates.length} rows</p>
                  </div>
                </div>
              )}

              {/* Column Mapping Selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CSV/Excel Column Mapping</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                  {MARKETPLACE_FIELDS.map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-medium capitalize flex items-center gap-1">
                        {field.replace(/_/g, ' ')}
                        {["title", "company_name", "email", "phone"].includes(field) && <span className="text-destructive">*</span>}
                      </Label>
                      <Select 
                        value={mktMapping[field] || ""} 
                        onValueChange={(v) => {
                          const updated = { ...mktMapping, [field]: v };
                          setMktMapping(updated);
                          analyzeDuplicates(mktData, updated);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.08]"><SelectValue placeholder="Skip mapping" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(mktData[0]).map((col) => (<SelectItem key={col} value={col}>{col}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row Preview Table */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parsed Sheet Preview (First 5 Rows)</p>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Row #</th>
                        {Object.keys(mktData[0]).map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mktData.slice(0, 5).map((row, i) => {
                        const email = row[mktMapping.email] || "";
                        const phone = row[mktMapping.phone] || "";
                        const isDbDup = duplicateAnalysis?.dbDuplicates.some(d => d[mktMapping.email] === email || d[mktMapping.phone] === phone);
                        const isLocalDup = duplicateAnalysis?.localDuplicates.some(d => d[mktMapping.email] === email || d[mktMapping.phone] === phone);

                        return (
                          <tr 
                            key={i} 
                            className={`border-b border-white/[0.02] hover:bg-white/[0.01] ${
                              isDbDup ? "bg-amber-500/[0.02]" : isLocalDup ? "bg-purple-500/[0.02]" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-muted-foreground font-semibold flex items-center gap-1.5">
                              {i + 1}
                              {isDbDup ? (
                                <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 text-[9px] px-1 py-0 h-4">DB Dup</Badge>
                              ) : isLocalDup ? (
                                <Badge variant="outline" className="border-purple-500/20 text-purple-500 bg-purple-500/5 text-[9px] px-1 py-0 h-4">Sheet Dup</Badge>
                              ) : null}
                            </td>
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{v || "—"}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {mktData.length > 5 && <p className="text-xs text-muted-foreground text-center py-1">Showing 5 of {mktData.length} records</p>}
              </div>

              {/* Progress UI */}
              {mktUploading && (
                <div className="space-y-2 p-4 rounded-xl border border-primary/10 bg-primary/[0.02]">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {importStatus}
                    </span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-1.5" />
                </div>
              )}

              {/* Import Results Box */}
              {mktImportResult && (
                <div 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300`} 
                  style={{ 
                    background: mktImportResult.failed > 0 ? 'rgba(239,68,68,0.03)' : 'rgba(16,185,129,0.03)', 
                    borderColor: mktImportResult.failed > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' 
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      {mktImportResult.failed > 0 ? (
                        <span className="text-red-500">⚠ Import finished with errors</span>
                      ) : (
                        <span className="text-emerald-500">✔ Lead directory imported successfully!</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Uploaded: <span className="font-semibold text-foreground">{mktImportResult.total}</span> · 
                      Clean Imported: <span className="font-semibold text-emerald-400">{mktImportResult.imported}</span> · 
                      Duplicates Skipped: <span className="font-semibold text-amber-400">{mktImportResult.skipped}</span> · 
                      Failed: <span className="font-semibold text-red-400">{mktImportResult.failed}</span>
                    </p>
                  </div>

                  {failedRows.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        const rowsToExport = failedRows.map(f => {
                          const { upload_batch_id, uploaded_by, seller_id, is_verified, source_type, ...rest } = f;
                          return rest;
                        });
                        exportToCSV(rowsToExport, "failed_lead_import_rows.csv");
                        toast({ title: "Failed Rows Exported 📥" });
                      }}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5 rotate-180" /> Export Failed Rows (CSV)
                    </Button>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={submitImport} 
                  disabled={mktUploading || (duplicateAnalysis?.clean.length === 0)} 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/10 border-0"
                >
                  {mktUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing leads...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Import {duplicateAnalysis?.clean.length ?? mktData.length} Clean Leads
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMktData([]);
                    setDuplicateAnalysis(null);
                    setMktImportResult(null);
                    setFailedRows([]);
                    if (mktFileRef.current) mktFileRef.current.value = "";
                  }} 
                  disabled={mktUploading}
                  className="border-white/10 hover:bg-white/[0.04]"
                >
                  Reset
                </Button>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Helper functions for Drag and Drop, Excel parser, targeted duplicate analysis, and bulk submission */}
      {(() => {
        // We define the helpers dynamically here or bind them to window/ref if needed,
        // but we can also place them directly in the component scope above.
        // Let's attach helper definitions to window/refs during the first render,
        // or just let the main component scope have them.
        // In this case, we've declared them in the component state & functions scope.
        return null;
      })()}

      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> All CRM Leads</CardTitle>
            <Button size="sm" variant="outline" className="border-white/10 gap-1.5" onClick={loadAllLeads} disabled={leadsLoading}>
              {leadsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} {leadsLoaded ? "Refresh" : "Load Leads"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!leadsLoaded ? (
            <p className="text-sm text-muted-foreground text-center py-8">Click "Load Leads" to view all CRM leads.</p>
          ) : allLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No CRM leads found.</p>
          ) : (
            <div className="overflow-x-auto">
              {selectedLeadIds.length > 0 && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{selectedLeadIds.length} lead(s) selected</span>
                  <Button size="sm" onClick={() => setReassignModalOpen(true)}>
                    Reassign Selected
                  </Button>
                </div>
              )}
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/[0.06]">
                  <th className="px-4 py-2 text-left w-10">
                    <input type="checkbox" className="rounded bg-background border-white/20 cursor-pointer" 
                      checked={selectedLeadIds.length > 0 && selectedLeadIds.length === allLeads.length}
                      onChange={toggleAllLeads}
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Company</th>
                  <th className="px-4 py-2 text-left font-medium">Assigned To</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium w-12"></th>
                </tr></thead>
                <tbody>{allLeads.map((l) => {
                  const sCfg = LEAD_STATUS_CONFIG[l.status] || LEAD_STATUS_CONFIG.new;
                  return (
                    <tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <input type="checkbox" className="rounded bg-background border-white/20 cursor-pointer" 
                          checked={selectedLeadIds.includes(l.id)}
                          onChange={() => toggleLeadSelection(l.id)}
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{l.company || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{l.profiles?.company_name || l.profiles?.full_name || "—"}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]" style={{ borderColor: l.source_type === "verified" ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.3)", color: l.source_type === "verified" ? "#10B981" : "#3B82F6" }}>{l.source_type}</Badge></td>
                      <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span></td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2.5"><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => deleteLead(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Reassign Modal */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Reassign {selectedLeadIds.length} Leads</DialogTitle>
            <DialogDescription>Select a new user to assign these leads to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target User ID</Label>
              <Input 
                placeholder="Enter User UUID" 
                value={reassignUserId} 
                onChange={(e) => setReassignUserId(e.target.value)} 
                className="bg-white/[0.03] border-white/[0.08]"
              />
              <p className="text-xs text-muted-foreground">You can find the User ID by searching for a user in the User Search panel above.</p>
            </div>
            <Button onClick={handleBulkReassign} disabled={reassigning || !reassignUserId} className="w-full">
              {reassigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Confirm Reassignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCrmTab;
