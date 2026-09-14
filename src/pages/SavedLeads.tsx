import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, ArrowRight, Loader2, StarOff, Filter, DownloadCloud, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { crmImportService } from "@/services/crmImport";

const SavedLeads = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth() as any;
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const { data: savedLeads = [], isLoading, refetch } = useQuery({
    queryKey: ["saved_leads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("saved_leads")
        .select(`
          id,
          created_at,
          lead_id,
          leads (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.filter((item: any) => item.leads !== null);
    },
    enabled: !!user?.id,
  });

  const handleRemove = async (savedLeadId: string) => {
    if (!user?.id) return;
    setRemovingId(savedLeadId);
    try {
      const { error } = await supabase
        .from("saved_leads")
        .delete()
        .eq("id", savedLeadId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Removed from Saved Leads" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleImportToCRM = async (leadId: string) => {
    if (!profile?.id) return;
    setImportingId(leadId);
    try {
      const workspaceId = profile.id;
      const result = await crmImportService.importLeadsToCRM([leadId], workspaceId, profile.id);
      
      if (result.success > 0) {
        toast({ title: "Imported to CRM", description: "Opportunity has been created successfully." });
        navigate('/opportunities');
      } else if (result.skipped > 0) {
        toast({ title: "Already exists", description: "This lead is already an active Opportunity in your CRM." });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImportingId(null);
    }
  };

  const filteredLeads = savedLeads.filter((item: any) => {
    const lead = item.leads;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.title?.toLowerCase().includes(searchLower) ||
      lead.company_name?.toLowerCase().includes(searchLower) ||
      lead.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-8 flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Saved Companies</h1>
            <p className="text-muted-foreground">Manage bookmarked leads and import them to your active pipeline.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search saved companies..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Company & Opportunity</th>
                  <th className="px-6 py-4">Industry</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date Saved</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        Loading saved companies...
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <StarOff className="w-8 h-8 text-muted-foreground/50" />
                        <p>No saved companies found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.map((item: any) => {
                  const lead = item.leads;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{lead.company_name || 'Unknown Company'}</span>
                          <span className="text-xs text-muted-foreground max-w-[200px] truncate">{lead.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{lead.industry || lead.category || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{lead.location || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => handleImportToCRM(lead.id)}
                            disabled={importingId === lead.id}
                            className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            {importingId === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                            Create Opportunity
                          </button>
                          <button 
                            onClick={() => navigate(`/lead/${lead.id}`)}
                            className="inline-flex items-center gap-1 bg-muted hover:bg-accent text-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleRemove(item.id)}
                            disabled={removingId === item.id}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedLeads;
