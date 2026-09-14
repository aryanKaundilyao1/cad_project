import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ShieldCheck, ShieldAlert, Check, X, Trash2, Edit } from "lucide-react";
import { CompanyBadge } from "@/components/CompanyBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const AdminVerificationTab = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit states
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*").eq("status", "pending");
      
      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm.trim());
        const orQuery = isUUID 
          ? `email.ilike.${term},company_name.ilike.${term},full_name.ilike.${term},id.eq.${searchTerm.trim()}`
          : `email.ilike.${term},company_name.ilike.${term},full_name.ilike.${term}`;
        query = query.or(orQuery);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ title: "Fetch failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const handleApprove = async (userId: string) => {
    setActionLoading(`approve-${userId}`);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          status: 'approved', 
          is_verified: true,
          subscription_plan: 'free' 
        })
        .eq("id", userId);
        
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Approved", description: "Company approved and placed in Free Tier." });
    } catch (err: any) {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(`reject-${userId}`);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: 'rejected', is_verified: false })
        .eq("id", userId);
        
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Rejected", description: "Company verification rejected." });
    } catch (err: any) {
      toast({ title: "Rejection failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to completely delete this user profile?")) return;
    setActionLoading(`delete-${userId}`);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Deleted", description: "User profile deleted." });
    } catch (err: any) {
      toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditName(user.full_name || "");
    setEditCompany(user.company_name || "");
    setEditEmail(user.email || "");
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setActionLoading(`edit-${editUser.id}`);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          company_name: editCompany,
          email: editEmail
        })
        .eq("id", editUser.id);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === editUser.id ? { ...u, full_name: editName, company_name: editCompany, email: editEmail } : u));
      toast({ title: "Success", description: "Profile updated successfully." });
      setEditUser(null);
    } catch (err: any) {
      toast({ title: "Edit failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="bg-card/40 border-white/5 max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Company Verification Center</CardTitle>
        <CardDescription>Review and manage companies with 'pending' status.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Email, Company Name, or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08]"
            />
          </div>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <div className="space-y-4">
          {loading && users.length === 0 ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">No pending companies found.</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border border-white/5 bg-white/[0.02] gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                      {user.company_name || user.full_name || 'No Name'}
                    </span>
                    <CompanyBadge profile={user} />
                    <Badge variant="outline" className="capitalize text-xs ml-2">
                      {user.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {user.email} • ID: {user.id.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-1">
                    Type: {user.user_type === 'company' ? 'Manufacturer/Vendor' : 'Buyer'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEdit(user)}
                    disabled={actionLoading !== null}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === `delete-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-1" /> Delete</>}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleReject(user.id)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === `reject-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Reject</>}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === `approve-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Approve</>}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input value={editCompany} onChange={e => setEditCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={actionLoading === `edit-${editUser?.id}`}>
              {actionLoading === `edit-${editUser?.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminVerificationTab;
