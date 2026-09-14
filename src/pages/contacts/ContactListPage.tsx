import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Search, Plus, Filter, ArrowRight, Mail, 
  Phone, Building2, PlusCircle, CheckSquare, Star,
  Target, PhoneCall, Zap, Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ContactListPage() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Contact Form States
  const [cName, setCName] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cDM, setCDM] = useState(false);

  // Daily Goal State
  const [dailyTarget, setDailyTarget] = useState(() => {
    return parseInt(localStorage.getItem('jas_daily_outreach_target') || '50');
  });

  const handleSetTarget = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value);
    if (!isNaN(num)) {
      setDailyTarget(num);
      localStorage.setItem('jas_daily_outreach_target', num.toString());
    }
  };

  // 1. Fetch Contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts_list_page', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          account:accounts(
            id, name,
            opportunities(
              id, lead_score,
              leads:leads(
                id, email, external_email, phone, external_phone
              )
            )
          )
        `)
        .eq('workspace_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // 2. Fetch Accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['contacts_form_accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('workspace_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Create Contact Mutation
  const createContactMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('contacts')
        .insert({
          workspace_id: user.id,
          account_id: selectedAccId || null,
          full_name: cName,
          job_title: cTitle,
          email: cEmail,
          phone: cPhone,
          is_decision_maker: cDM,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts_list_page'] });
      toast({ title: "Contact added successfully" });
      setShowCreateForm(false);
      // Reset
      setCName('');
      setCTitle('');
      setSelectedAccId('');
      setCEmail('');
      setCPhone('');
      setCDM(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to add contact", description: err.message, variant: "destructive" });
    }
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cEmail) {
      toast({ title: "Name and Email are required", variant: "destructive" });
      return;
    }
    createContactMutation.mutate();
  };

  // Log Outreach Mutation
  const logOutreachMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts_list_page'] });
      toast({ title: "Outreach logged successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to log outreach", description: err.message, variant: "destructive" });
    }
  });

  // Resolve email and phone from contacts, accounts, or leads with fallbacks
  const today = new Date().toISOString().split('T')[0];
  const resolvedContacts = React.useMemo(() => {
    return contacts.map((c: any) => {
      let resolvedEmail = c.email;
      if (!resolvedEmail || resolvedEmail === '-' || resolvedEmail.trim() === '') {
        const opps = c.account?.opportunities || [];
        for (const opp of opps) {
          const lead = opp.leads;
          if (lead) {
            resolvedEmail = lead.email || lead.external_email;
            if (resolvedEmail) break;
          }
        }
      }
      if (!resolvedEmail || resolvedEmail === '-' || resolvedEmail.trim() === '') {
        resolvedEmail = 'Not Available';
      }

      let resolvedPhone = c.phone;
      if (!resolvedPhone || resolvedPhone === '-' || resolvedPhone.trim() === '') {
        const opps = c.account?.opportunities || [];
        for (const opp of opps) {
          const lead = opp.leads;
          if (lead) {
            resolvedPhone = lead.phone || lead.external_phone;
            if (resolvedPhone) break;
          }
        }
      }
      if (!resolvedPhone || resolvedPhone === '-' || resolvedPhone.trim() === '') {
        resolvedPhone = 'Not Available';
      }

      const opps = c.account?.opportunities || [];
      const maxScore = opps.length > 0 ? Math.max(...opps.map((o:any) => o.lead_score || 0)) : 0;
      const contactedToday = c.last_contacted_at?.startsWith(today);

      return {
        ...c,
        resolvedEmail,
        resolvedPhone,
        maxScore,
        contactedToday
      };
    }).sort((a: any, b: any) => {
      // Sort by whether they were contacted today (uncontacted first)
      if (a.contactedToday !== b.contactedToday) return a.contactedToday ? 1 : -1;
      // Then sort by highest OIE score
      return b.maxScore - a.maxScore;
    });
  }, [contacts, today]);

  const contactedTodayCount = resolvedContacts.filter((c:any) => c.contactedToday).length;
  const progressPct = dailyTarget > 0 ? Math.min(100, (contactedTodayCount / dailyTarget) * 100) : 0;

  // Filter
  const filteredContacts = resolvedContacts.filter((c: any) => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.resolvedEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Contacts Directory
          </h1>
          <p className="text-muted-foreground mt-1">Manage and audit linked contacts, stakeholders, and decision makers.</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      {/* DAILY GOAL TRACKER */}
      <Card className="bg-card border-primary/20 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Daily Outreach Target</h3>
                <p className="text-sm text-muted-foreground">Keep track of your outreach activities.</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-xl w-full space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>{contactedTodayCount} Contacted Today</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">Target:</span>
                  <input 
                    type="number" 
                    value={dailyTarget} 
                    onChange={handleSetTarget}
                    className="w-16 bg-background border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-primary"
                    min="1"
                  />
                </div>
              </div>
              <Progress value={progressPct} className="h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CREATE FORM */}
      {showCreateForm && (
        <Card className="bg-card border-primary/20 shadow-md animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Register Target Contact</CardTitle>
            <CardDescription>Link stakeholders to existing corporate accounts for outreach activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateContact} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g., John Doe"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Job Title</label>
                <input 
                  type="text" 
                  placeholder="E.g., Procurement Director"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Corporate Account</label>
                <select
                  value={selectedAccId}
                  onChange={(e) => setSelectedAccId(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="E.g., john@company.com"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="E.g., +1 (555) 0199"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-end gap-2 pb-2">
                <input 
                  type="checkbox" 
                  id="cDM"
                  checked={cDM} 
                  onChange={(e) => setCDM(e.target.checked)}
                  className="rounded border-white/10 text-primary bg-background w-4 h-4 cursor-pointer"
                />
                <label htmlFor="cDM" className="text-xs text-muted-foreground cursor-pointer select-none">Key Decision Maker</label>
              </div>

              <div className="flex items-end justify-end gap-2 md:col-span-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit">Submit Contact</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      <Card className="bg-card border-white/10 shadow-md">
        <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.01]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
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
                  <th className="px-6 py-4">Name / Title</th>
                  <th className="px-6 py-4">Corporate Account</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoadingContacts ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>No contacts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {contact.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{contact.full_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{contact.job_title || 'No Title Listed'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact.account ? (
                          <Link to={`/accounts/${contact.account.id}`} className="text-primary hover:underline font-medium">
                            {contact.account.name}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {contact.resolvedEmail}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {contact.resolvedPhone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {contact.is_decision_maker ? (
                            <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                              Decision Maker
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit bg-white/5 border-white/5 text-muted-foreground text-[10px]">
                              Stakeholder
                            </Badge>
                          )}
                          {contact.maxScore > 0 && !contact.contactedToday && contact === resolvedContacts.filter((c:any) => !c.contactedToday)[0] && (
                            <Badge variant="secondary" className="w-fit bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] animate-pulse">
                              <Zap className="w-3 h-3 mr-1" /> Next Best Action
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {contact.contactedToday ? (
                            <Button size="sm" variant="outline" disabled className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckSquare className="w-3.5 h-3.5 mr-1" /> Contacted
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => logOutreachMutation.mutate(contact.id)}>
                              <PhoneCall className="w-3.5 h-3.5 mr-1" /> Log Outreach
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/contacts/${contact.id}`)}>
                            View Profile <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}
