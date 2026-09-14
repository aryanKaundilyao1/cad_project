import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, CheckCircle2, XCircle, Trash2, Archive, Edit, Eye, Filter, ShieldCheck, FileText, CheckSquare, Square } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { classifyLead } from "@/lib/leadClassification";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLeadManagementTab() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"all"|"id"|"company"|"title"|"industry"|"location">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<string>("all");

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<any | null>(null);
  
  // Edit form state
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, searchBy, filterStatus, filterVerification]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("leads")
        .select("*, profiles!leads_seller_id_fkey(full_name, company_name, email, phone)");

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        if (searchBy === "all") {
          query = query.or(`id.ilike.${term},title.ilike.${term},company_name.ilike.${term},industry.ilike.${term},location.ilike.${term}`);
        } else if (searchBy === "id") {
          query = query.ilike('id', term);
        } else if (searchBy === "company") {
          query = query.or(`company_name.ilike.${term},external_company_name.ilike.${term}`);
        } else if (searchBy === "title") {
          query = query.ilike('title', term);
        } else if (searchBy === "industry") {
          query = query.ilike('industry', term);
        } else if (searchBy === "location") {
          query = query.ilike('location', term);
        }
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterVerification !== "all") {
        query = query.eq("verification_status", filterVerification);
      }

      query = query.order("created_at", { ascending: false }).limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast({ title: "Failed to fetch leads", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    let confirmMsg = `Are you sure you want to ${action} ${selectedIds.length} leads?`;
    if (action === 'delete') {
      confirmMsg = `CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} leads? This will trigger cascading deletes across CRM, payments, and saved leads. This action cannot be undone.`;
    }

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('leads').delete().in('id', selectedIds);
        if (error) throw error;
        toast({ title: "Leads permanently deleted 🗑️" });
      } else if (action === 'archive') {
        const { error } = await supabase.from('leads').update({ status: 'Archived', lead_status: 'archived' } as any).in('id', selectedIds);
        if (error) throw error;
        toast({ title: "Leads archived 📦" });
      } else if (action === 'approve') {
        const { error } = await supabase.from('leads').update({ verification_status: 'VERIFIED', is_verified: true, status: 'Active' } as any).in('id', selectedIds);
        if (error) throw error;
        toast({ title: "Leads approved ✅" });
      } else if (action === 'reject') {
        const { error } = await supabase.from('leads').update({ verification_status: 'REJECTED', status: 'Archived' } as any).in('id', selectedIds);
        if (error) throw error;
        toast({ title: "Leads rejected ❌" });
      }

      setSelectedIds([]);
      fetchLeads();
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (err: any) {
      toast({ title: `Bulk ${action} failed`, description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (lead: any) => {
    setActiveLead(lead);
    setEditData({
      title: lead.title || "",
      description: lead.description || "",
      budget_min: lead.budget_min || 0,
      budget_max: lead.budget_max || 0,
      industry: lead.industry || "",
      location: lead.location || "",
      status: lead.status || "pending",
      verification_status: lead.verification_status || "pending"
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!activeLead) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('leads').update(editData).eq('id', activeLead.id);
      if (error) throw error;
      
      toast({ title: "Lead updated successfully" });
      setEditDialogOpen(false);
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Failed to update lead", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE this lead? This will trigger cascading deletes across CRM, payments, and saved leads. This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Lead permanently deleted 🗑️" });
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveSingle = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('leads').update({ status: 'Archived', lead_status: 'archived' } as any).eq('id', id);
      if (error) throw error;
      toast({ title: "Lead archived 📦" });
      fetchLeads();
    } catch (err: any) {
      toast({ title: "Archive failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Lead Database
              </CardTitle>
              <CardDescription>Comprehensive view of all leads across the platform</CardDescription>
            </div>
            
            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                <span className="text-xs font-medium px-2 text-primary">{selectedIds.length} selected</span>
                <Button size="sm" variant="ghost" className="h-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400" onClick={() => handleBulkAction('approve')} disabled={actionLoading}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400" onClick={() => handleBulkAction('archive')} disabled={actionLoading}>
                  <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400" onClick={() => handleBulkAction('reject')} disabled={actionLoading}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <div className="w-px h-4 bg-primary/20 mx-1"></div>
                <Button size="sm" variant="destructive" className="h-7" onClick={() => handleBulkAction('delete')} disabled={actionLoading}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-wrap gap-3">
            <div className="flex flex-1 min-w-[200px] items-center gap-2 bg-background border border-white/10 rounded-md px-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                className="border-0 bg-transparent h-9 focus-visible:ring-0 px-0" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={searchBy} onValueChange={(val: any) => setSearchBy(val)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="id">Lead ID</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Awarded">Awarded</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterVerification} onValueChange={setFilterVerification}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : leads.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground border-t border-dashed border-white/5">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
                No leads match your criteria.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <button onClick={toggleAll} className="text-muted-foreground hover:text-white transition-colors">
                        {selectedIds.length === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Lead Info</th>
                    <th className="px-4 py-3 font-medium">Industry & Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map((lead) => (
                    <tr key={lead.id} className={`hover:bg-white/[0.02] transition-colors ${selectedIds.includes(lead.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleSelection(lead.id)} className="text-muted-foreground hover:text-white transition-colors">
                          {selectedIds.includes(lead.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground line-clamp-1 max-w-[300px]" title={lead.title}>{lead.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                          <span className="font-mono text-primary/70">{lead.id.substring(0,8)}</span>
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground/90">{lead.industry || '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{lead.location || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 border-white/10 ${
                            lead.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            lead.status === 'Planning' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            lead.status === 'Negotiation' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            lead.status === 'Awarded' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            lead.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-white/5 text-muted-foreground border-white/10'
                          }`}>
                            {lead.status || 'Active'}
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 border-white/10 ${
                            lead.verification_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                            lead.verification_status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                            lead.verification_status === 'SUSPICIOUS' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {lead.verification_status || 'pending'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setActiveLead(lead); setViewDialogOpen(true); }}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(lead)}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleArchiveSingle(lead.id)}>
                            <Archive className="w-4 h-4 text-amber-500/70" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-rose-500/10" onClick={() => handleDeleteSingle(lead.id)}>
                            <Trash2 className="w-4 h-4 text-rose-500/70" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Modify lead properties directly.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea className="h-24" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Industry</label>
              <Input value={editData.industry || ''} onChange={e => setEditData({...editData, industry: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Location</label>
              <Input value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Select value={editData.status || 'Active'} onValueChange={val => setEditData({...editData, status: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Awarded">Awarded</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Verification</label>
              <Select value={editData.verification_status || 'pending'} onValueChange={val => setEditData({...editData, verification_status: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Min Budget (₹)</label>
              <Input type="number" value={editData.budget_min || 0} onChange={e => setEditData({...editData, budget_min: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Max Budget (₹)</label>
              <Input type="number" value={editData.budget_max || 0} onChange={e => setEditData({...editData, budget_max: Number(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border-white/10">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>ID: {activeLead?.id}</DialogDescription>
          </DialogHeader>
          {activeLead && (
            <div className="space-y-4 py-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-1">{activeLead.title}</h4>
                <p className="text-muted-foreground">{activeLead.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Budget</span>
                  <span>₹{activeLead.budget_min?.toLocaleString()} - ₹{activeLead.budget_max?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Location</span>
                  <span>{activeLead.location || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Industry</span>
                  <span>{activeLead.industry || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Company</span>
                  <span>{activeLead.company_name || activeLead.profiles?.company_name || '—'}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => { setViewDialogOpen(false); openEdit(activeLead); }}>Edit Lead</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
