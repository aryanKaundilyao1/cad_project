import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, Search, Plus, Filter, ArrowRight, Link2, 
  MapPin, Globe, Phone, PlusCircle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AccountListPage() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Account Form States
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts_list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          opportunities (id, title)
        `)
        .eq('workspace_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Create Account Mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('accounts')
        .insert({
          workspace_id: user.id,
          name: newName,
          industry: newIndustry || 'Technology',
          website: newWebsite,
          phone: newPhone,
          hq_location: newLocation,
          city: newCity,
          country: newCountry,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_list'] });
      toast({ title: "Account created successfully" });
      setShowCreateForm(false);
      // Reset
      setNewName('');
      setNewIndustry('');
      setNewWebsite('');
      setNewPhone('');
      setNewLocation('');
      setNewCity('');
      setNewCountry('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to create account", description: err.message, variant: "destructive" });
    }
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }
    createAccountMutation.mutate();
  };

  // Filter
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" /> Accounts Directory
          </h1>
          <p className="text-muted-foreground mt-1">Manage and audit linked corporate profiles and opportunities.</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Account
        </Button>
      </div>

      {/* CREATE FORM */}
      {showCreateForm && (
        <Card className="bg-card border-primary/20 shadow-md animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Create Corporate Profile</CardTitle>
            <CardDescription>Add a new company record to link contacts and opportunities.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Company Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g., Jas Infra Group"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Industry</label>
                <input 
                  type="text" 
                  placeholder="E.g., Construction"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Website</label>
                <input 
                  type="url" 
                  placeholder="E.g., https://jasinfra.com"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Phone</label>
                <input 
                  type="text" 
                  placeholder="E.g., +1 (555) 0199"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">HQ Location</label>
                <input 
                  type="text" 
                  placeholder="E.g., London, UK"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">City</label>
                <input 
                  type="text" 
                  placeholder="E.g., Birmingham"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-end justify-end gap-2 md:col-span-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit">Submit Account</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Directory Table */}
      <Card className="bg-card border-white/10 shadow-md">
        <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-white/10 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">Account Name</th>
                  <th className="px-6 py-4">Industry</th>
                  <th className="px-6 py-4">HQ Location</th>
                  <th className="px-6 py-4">Linked Opps</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>No corporate accounts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const oppCount = acc.opportunities?.length || 0;
                    return (
                      <tr key={acc.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{acc.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{acc.city || 'No City'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {acc.industry || '-'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5 mt-2.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {acc.hq_location || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={oppCount > 0 ? 'bg-primary/5 text-primary border-primary/10' : 'bg-white/5 border-white/5 text-muted-foreground'}>
                            {oppCount} Opportunities
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {acc.website ? (
                            <a href={acc.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors text-xs">
                              <Globe className="h-3.5 w-3.5" /> Website <Link2 className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/accounts/${acc.id}`)}>
                            View Profile <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
