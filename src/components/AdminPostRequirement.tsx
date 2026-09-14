import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Building2, Upload, FileSpreadsheet, CheckCircle2, Search } from "lucide-react";
import { parseCSV, standardizeLeadRow } from "@/utils/exportUtils";
import { useIndustries } from "@/hooks/useBusinessProfile";

const PROJECT_TYPES = [
  "New Business Lead", "Partnership Opportunity", "Service Requirement",
  "Product Inquiry", "Consultation Request", "Vendor Search", "Other",
];

const AdminPostRequirement = ({ adminProfile }: { adminProfile: any }) => {
  const { toast } = useToast();
  const [isExternal, setIsExternal] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkData, setBulkData] = useState<Record<string, string>[]>([]);
  const [assignDirectly, setAssignDirectly] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { data: industries = [] } = useIndustries();

  const classifyNiche = (title: string, desc: string, category: string, list: any[]) => {
    const text = `${title} ${desc} ${category}`.toLowerCase();
    for (const ind of list) {
      if (ind.name && text.includes(ind.name.toLowerCase())) {
        return ind.id;
      }
    }
    if (category) {
      const matched = list.find(ind => 
        ind.name && (ind.name.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(ind.name.toLowerCase()))
      );
      if (matched) return matched.id;
    }
    return list[0]?.id || null;
  };
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [targetSection, setTargetSection] = useState<"verified" | "auto">("verified");

  useEffect(() => {
    // Initial load for user dropdown
    searchUsers("");
  }, []);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_type: "New Business Lead",
    category: "",
    industry_id: "",
    location: "",
    budget_min: "",
    budget_max: "",
    total_area: "",
    timeline: "",
    // External company fields
    external_company_name: "",
    external_contact_name: "",
    external_phone: "",
    external_email: "",
    external_website: "",
  });

  const updateForm = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const searchUsers = async (val: string) => {
    setUserSearch(val);
    setSearching(true);
    let query = supabase.from("profiles").select("id, full_name, company_name, email, username").limit(50);
    
    if (val && val.trim() !== "") {
      query = query.or(`full_name.ilike.%${val}%,company_name.ilike.%${val}%,email.ilike.%${val}%,username.ilike.%${val}%`);
    }
    
    const { data } = await query;
    setSearchResults(data || []);
    setSearching(false);
  };

  const submitRequirement = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!form.location.trim()) { toast({ title: "Location is required", variant: "destructive" }); return; }
    if (isExternal && !form.external_company_name.trim()) {
      toast({ title: "External company name is required", variant: "destructive" }); return;
    }

    setSubmitting(true);
    try {
      const finalCategory = form.category || null;
      const matchedIndustryId = classifyNiche(
        form.title || "",
        form.description || "",
        finalCategory || "",
        industries
      );

      const payload: any = {
        title: form.title,
        description: form.description || null,
        project_type: form.project_type,
        category: finalCategory,
        industry_id: form.industry_id || matchedIndustryId,
        location: form.location,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        total_area: form.total_area ? Number(form.total_area) : null,
        timeline: form.timeline || null,
        tender_end_date: form.tender_end_date || null,
        seller_id: adminProfile.id,
        plan_type: "premium",
        status: "Active",
        is_verified: true,
        is_public: true,
        verification_status: "VERIFIED",
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        source_type: isExternal ? "admin_external" : "admin",
      };

      if (isExternal) {
        payload.external_company_name = form.external_company_name;
        payload.external_contact_name = form.external_contact_name || null;
        payload.external_phone = form.external_phone || null;
        payload.external_email = form.external_email || null;
        payload.external_website = form.external_website || null;
      }

      const { data: newLead, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) throw error;

      // Direct CRM Injection if enabled
      if (assignDirectly && selectedUser && newLead) {
        await (supabase as any).from("crm_leads").insert({
          assigned_to: selectedUser.id,
          assigned_by: adminProfile.id,
          source_type: targetSection,
          source_origin: "admin_manual",
          name: isExternal ? (form.external_contact_name || form.external_company_name) : 'Admin Posted',
          phone: isExternal ? form.external_phone : null,
          email: isExternal ? form.external_email : null,
          company: isExternal ? form.external_company_name : null,
          location: form.location,
          requirement: form.title,
          description: form.description,
          category: form.category,
          budget_min: form.budget_min ? Number(form.budget_min) : null,
          budget_max: form.budget_max ? Number(form.budget_max) : null,
          total_area: form.total_area,
          status: 'pending',
          notes: `Directly assigned by admin. Marketplace Lead ID: ${newLead.id}`
        });
      }

      toast({ title: "Requirement Posted ✅", description: assignDirectly ? `Posted and assigned to ${selectedUser.company_name || selectedUser.full_name}` : `"${form.title}" is now live.` });
      setForm({
        title: "", description: "", project_type: "New Business Lead", category: "", location: "",
        budget_min: "", budget_max: "", total_area: "", timeline: "",
        external_company_name: "", external_contact_name: "", external_phone: "",
        external_email: "", external_website: "",
      });
      setSelectedUser(null);
      setUserSearch("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  // Bulk CSV upload
  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { toast({ title: "Empty or invalid CSV", variant: "destructive" }); return; }
      setBulkData(parsed);
    };
    reader.readAsText(file);
  };

  const submitBulk = async () => {
    if (bulkData.length === 0) return;
    setBulkUploading(true);
    try {
      const rows = bulkData.map((row) => {
        const std = standardizeLeadRow(row);
        const matchedIndustryId = classifyNiche(std.title, std.description || "", `${std.industry || ''} ${std.niche || ''}`, industries);

        return {
          title: std.title,
          description: std.description,
          project_type: row["project_type"] || row["type"] || row["Type"] || "New Business Lead",
          category: std.industry,
          industry_id: matchedIndustryId,
          location: std.location,
          budget_min: std.budget_min,
          budget_max: std.budget_max,
          total_area: std.total_area,
          seller_id: adminProfile.id,
          plan_type: "premium",
          status: "Active",
          is_verified: true,
          is_public: true,
          verification_status: "VERIFIED",
          approved_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          source_type: "admin_external",
          external_company_name: std.company_name || "External Company",
          external_contact_name: std.contact_name,
          external_phone: std.phone,
          external_email: std.email,
          external_website: std.website,
          metadata: std.metadata
        };
      });

      const { data: insertedLeads, error } = await supabase.from("leads").insert(rows).select();
      if (error) throw error;

      // Bulk CRM Assignment
      if (assignDirectly && selectedUser && insertedLeads && insertedLeads.length > 0) {
        const crmRows = insertedLeads.map((newLead: any) => ({
          assigned_to: selectedUser.id,
          assigned_by: adminProfile.id,
          source_type: targetSection,
          source_origin: "admin_manual",
          name: newLead.external_contact_name || newLead.external_company_name || 'Admin Posted',
          phone: newLead.external_phone,
          email: newLead.external_email,
          company: newLead.external_company_name,
          location: newLead.location,
          requirement: newLead.title,
          description: newLead.description,
          category: newLead.category,
          budget_min: newLead.budget_min,
          budget_max: newLead.budget_max,
          total_area: newLead.total_area,
          status: 'pending',
          notes: `Bulk assigned by admin. Marketplace Lead ID: ${newLead.id}`
        }));
        const { error: crmError } = await (supabase as any).from("crm_leads").insert(crmRows);
        if (crmError) throw crmError;
      }

      toast({ title: `${rows.length} Requirements Posted ✅`, description: assignDirectly ? `Posted and assigned to ${selectedUser.company_name || selectedUser.full_name}` : "All leads are now live in the marketplace." });
      setBulkData([]);
      if (fileRef.current) fileRef.current.value = "";
      // Reset user selection if needed
    } catch (err: any) {
      toast({ title: "Bulk Upload Error", description: err.message, variant: "destructive" });
    }
    setBulkUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Single Requirement */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> Post Requirement to Marketplace
          </CardTitle>
          <CardDescription>Create a new requirement that appears in the marketplace. Users pay ₹99 to unlock contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Toggle */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Post as External Company</p>
              <p className="text-xs text-muted-foreground">
                {isExternal
                  ? "Users will see external company details when they unlock — not admin info."
                  : "Users will see admin profile details when they unlock."}
              </p>
            </div>
            <Switch checked={isExternal} onCheckedChange={setIsExternal} />
          </div>

          {/* External Company Details */}
          {isExternal && (
            <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">External Company Details</span>
                <Badge className="text-[9px] border-0" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Shown to users on unlock</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Company Name *</Label>
                  <Input value={form.external_company_name} onChange={(e) => updateForm("external_company_name", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="e.g. Acme Solutions" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contact Person</Label>
                  <Input value={form.external_contact_name} onChange={(e) => updateForm("external_contact_name", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input value={form.external_phone} onChange={(e) => updateForm("external_phone", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={form.external_email} onChange={(e) => updateForm("external_email", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="contact@company.com" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Website (Optional)</Label>
                  <Input value={form.external_website} onChange={(e) => updateForm("external_website", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="https://company.com" />
                </div>
              </div>
            </div>
          )}

          {/* Requirement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Requirement Title *</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="e.g. SaaS Platform Development Lead in Mumbai" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="bg-white/[0.03] border-white/[0.08] min-h-[80px]" placeholder="Detailed requirement description..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lead Type</Label>
              <Select value={form.project_type} onValueChange={(v) => updateForm("project_type", v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Industry</Label>
              <Select value={form.industry_id} onValueChange={(v) => {
                const ind = industries.find((i: any) => i.id === v);
                setForm(p => ({ ...p, industry_id: v, category: ind ? ind.name : "" }));
              }}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {industries.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location *</Label>
              <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="e.g. Gurgaon, Haryana" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total Area (sq ft)</Label>
              <Input type="number" value={form.total_area} onChange={(e) => updateForm("total_area", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="10000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Budget Min (₹)</Label>
              <Input type="number" value={form.budget_min} onChange={(e) => updateForm("budget_min", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="500000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Budget Max (₹)</Label>
              <Input type="number" value={form.budget_max} onChange={(e) => updateForm("budget_max", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="2000000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Timeline</Label>
              <Input value={form.timeline} onChange={(e) => updateForm("timeline", e.target.value)} className="bg-white/[0.03] border-white/[0.08]" placeholder="e.g. 3 months" />
            </div>
          </div>

          {/* ── Direct Assignment ── */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={assignDirectly} onCheckedChange={setAssignDirectly} />
                <Label className="text-sm font-semibold">Assign directly to user CRM</Label>
              </div>
              {assignDirectly && (
                <div className="flex gap-2">
                  <Button size="sm" variant={targetSection === "verified" ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => setTargetSection("verified")}>Premium</Button>
                  <Button size="sm" variant={targetSection === "auto" ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => targetSection !== "auto" && setTargetSection("auto")}>Additional</Button>
                </div>
              )}
            </div>

            {assignDirectly && (
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, company, or email to assign..."
                    value={userSearch}
                    onFocus={() => { if (!searchResults.length) searchUsers(""); }}
                    onChange={(e) => searchUsers(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.08]"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                </div>

                {searchResults.length > 0 && !selectedUser && (
                  <div className="absolute z-50 w-full mt-1 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 hover:bg-white/5 cursor-pointer flex flex-col border-b border-white/5 last:border-0"
                        onClick={() => { 
                          try {
                            setSelectedUser(u); 
                            setSearchResults([]); 
                            setUserSearch(String(u.full_name || u.company_name || u.email || ""));
                          } catch (e) {
                            console.error("Error setting selected user:", e);
                          }
                        }}
                      >
                        <span className="text-sm font-medium">{u.full_name || u.company_name}</span>
                        <span className="text-[10px] text-muted-foreground">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{String(selectedUser.full_name || selectedUser.company_name || selectedUser.email || 'User')} selected</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setSelectedUser(null); setUserSearch(""); }}>Change</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button onClick={submitRequirement} disabled={submitting || (assignDirectly && !selectedUser)} className="w-full h-12 text-lg font-bold gap-2 mt-4">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {assignDirectly ? 'Post & Assign Lead' : 'Post Requirement'}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" /> Bulk CSV → Marketplace
          </CardTitle>
          <CardDescription>Upload a CSV file to create multiple requirements at once. All will appear as external company leads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Expected CSV columns:</p>
            <code className="text-[10px]">title, description, project_type, category, location, budget_min, budget_max, total_area, company_name, contact_name, phone, email, website</code>
          </div>

          <Input type="file" accept=".csv" ref={fileRef} onChange={handleBulkFile} className="bg-white/[0.03] border-white/[0.08] max-w-xs" />

          {bulkData.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground font-medium">{bulkData.length} rows detected</span>
              </div>

              {/* Preview */}
              <div className="overflow-x-auto max-h-48 rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead><tr className="bg-white/[0.03]">{Object.keys(bulkData[0]).filter(k => k && !k.startsWith("_EMPTY")).slice(0, 6).map((h) => <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>)}</tr></thead>
                  <tbody>{bulkData.slice(0, 4).map((row, i) => (<tr key={i} className="border-t border-white/[0.03]">{Object.entries(row).filter(([k]) => k && !k.startsWith("_EMPTY")).map(([k, v], j) => j < 6 ? <td key={j} className="px-3 py-1.5 text-muted-foreground">{v}</td> : null)}</tr>))}</tbody>
                </table>
                {bulkData.length > 4 && <p className="text-xs text-muted-foreground text-center py-2">...and {bulkData.length - 4} more rows</p>}
              </div>

              {/* ── Direct Bulk Assignment ── */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={assignDirectly} onCheckedChange={setAssignDirectly} />
                    <Label className="text-sm font-semibold">Assign directly to user CRM</Label>
                  </div>
                  {assignDirectly && (
                    <div className="flex gap-2">
                      <Button size="sm" variant={targetSection === "verified" ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => setTargetSection("verified")}>Premium</Button>
                      <Button size="sm" variant={targetSection === "auto" ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => targetSection !== "auto" && setTargetSection("auto")}>Additional</Button>
                    </div>
                  )}
                </div>

                {assignDirectly && (
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search name, company, or email to assign..."
                        value={userSearch}
                        onFocus={() => { if (!searchResults.length) searchUsers(""); }}
                        onChange={(e) => searchUsers(e.target.value)}
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>

                    {searchResults.length > 0 && !selectedUser && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 hover:bg-white/5 cursor-pointer flex flex-col border-b border-white/5 last:border-0"
                            onClick={() => { 
                              try {
                                setSelectedUser(u); 
                                setSearchResults([]); 
                                setUserSearch(String(u.full_name || u.company_name || u.email || ""));
                              } catch (e) {
                                console.error("Error setting selected user:", e);
                              }
                            }}
                          >
                            <span className="text-sm font-medium">{u.full_name || u.company_name}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedUser && (
                      <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{String(selectedUser.full_name || selectedUser.company_name || selectedUser.email || 'User')} selected</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setSelectedUser(null); setUserSearch(""); }}>Change</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={submitBulk} disabled={bulkUploading || (assignDirectly && !selectedUser)} className="w-full gap-2 mt-4">
                {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {assignDirectly ? `Post & Assign ${bulkData.length} Requirements` : `Post ${bulkData.length} Requirements to Marketplace`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPostRequirement;
