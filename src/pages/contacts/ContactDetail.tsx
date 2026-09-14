import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, User, Building2, Mail, Phone, Calendar, 
  ArrowLeft, MessageSquare, Plus, PlusCircle, CheckCircle2,
  Trash2, Globe, Linkedin, ShieldAlert, Award
} from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  // Logging interaction states
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState<'call' | 'email' | 'meeting' | 'note'>('call');
  const [logTitle, setLogTitle] = useState('');
  const [logDesc, setLogDesc] = useState('');

  useEffect(() => {
    fetchContactData();
  }, [id]);

  const fetchContactData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Contact & Account Info
      const { data: contactData, error: contactErr } = await supabase
        .from('contacts')
        .select(`
          *,
          account:accounts(*)
        `)
        .eq('id', id)
        .single();

      if (contactErr) {
        console.error("Error fetching contact details:", contactErr);
        toast({ title: "Contact not found", variant: "destructive" });
        navigate('/contacts');
        return;
      }
      setContact(contactData);

      // 2. Fetch recent activities for this contact (or general account activities as fallback)
      if (contactData.account_id) {
        const { data: actsData } = await supabase
          .from('activities')
          .select('*')
          .eq('account_id', contactData.account_id)
          .order('activity_timestamp', { ascending: false })
          .limit(10);
        setActivities(actsData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle || !logDesc) {
      toast({ title: "Title and description are required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          workspace_id: contact.workspace_id,
          account_id: contact.account_id || null,
          activity_type: logType,
          title: logTitle,
          description: logDesc,
          created_by: user.id
        });

      if (error) throw error;
      toast({ title: "Interaction logged successfully" });
      setShowLogForm(false);
      setLogTitle('');
      setLogDesc('');
      fetchContactData();
    } catch (err: any) {
      toast({ title: "Failed to log interaction", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 pb-24 overflow-y-auto">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {/* Profile Card */}
        <Card className="bg-card border-white/10 shadow-md">
          <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shrink-0">
                {contact?.full_name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  {contact?.full_name}
                  {contact?.is_decision_maker ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2 py-0.5">
                      Decision Maker
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white/5 border-white/5 text-muted-foreground text-xs px-2 py-0.5">
                      Stakeholder
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">{contact?.job_title || 'No Job Title Listed'}</p>
                
                {contact?.account && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Building2 className="w-4 h-4" /> Linked Account: 
                    <Link to={`/accounts/${contact.account.id}`} className="text-primary hover:underline font-semibold">
                      {contact.account.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button onClick={() => setShowLogForm(!showLogForm)} className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Log Interaction
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LOG FORM */}
        {showLogForm && (
          <Card className="bg-card border-primary/20 shadow-md animate-in slide-in-from-top-2 duration-200">
            <CardHeader>
              <CardTitle className="text-base">Log Communication Activity</CardTitle>
              <CardDescription>Enter details of the correspondence to record in the activity stream.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogInteraction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Interaction Type</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as any)}
                      className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="note">Internal Note</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Activity Title *</label>
                    <input 
                      type="text" required placeholder="E.g., Call with John" value={logTitle} onChange={(e) => setLogTitle(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Summary / Notes *</label>
                  <textarea 
                    required placeholder="Enter details of conversation..." value={logDesc} onChange={(e) => setLogDesc(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-24"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button size="sm" type="button" variant="ghost" onClick={() => setShowLogForm(false)}>Cancel</Button>
                  <Button size="sm" type="submit">Log Activity</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="bg-card border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Email</span>
                  <a href={`mailto:${contact?.email}`} className="font-semibold text-primary hover:underline">{contact?.email || '-'}</a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Phone</span>
                  <span className="font-medium text-foreground">{contact?.phone || '-'}</span>
                </div>
              </div>

              {contact?.account && (
                <>
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Company</span>
                      <span className="font-medium text-foreground">{contact.account.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Industry</span>
                      <span className="font-medium text-foreground">{contact.account.industry || '-'}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Account Communication Timeline</CardTitle>
              <CardDescription>Recent touchpoints logged for this contact's associated corporate profile.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-white/5">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No communication logs recorded. Log interactions above to start.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-4 flex items-start gap-3">
                    <div className="mt-0.5"><MessageSquare className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-semibold text-xs text-foreground uppercase tracking-wider">{act.activity_type}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(act.activity_timestamp), { addSuffix: true })}</span>
                      </div>
                      <h5 className="text-xs font-semibold text-foreground">{act.title}</h5>
                      <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{act.description}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
