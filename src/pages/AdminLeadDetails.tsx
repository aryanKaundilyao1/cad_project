import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Mail, Phone, MapPin, Briefcase, FileText, Globe, Tag, Check, X, Shield, History, Brain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function AdminLeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }
    fetchLead();
  }, [id, profile]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('raw_leads').select('*').eq('id', id).single();
      if (error) throw error;
      setLead(data);
    } catch (err: any) {
      toast({ title: "Error fetching lead", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const tier = newStatus === 'APPROVED' ? lead.tier : newStatus === 'REJECTED' ? 'REJECTED' : lead.tier;
      const { error } = await supabase.from('raw_leads').update({ status: newStatus, tier }).eq('id', id);
      if (error) throw error;
      toast({ title: `Lead marked as ${newStatus}` });
      fetchLead();
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="p-10 flex justify-center">Loading Lead Details...</div>;
  if (!lead) return <div className="p-10 flex justify-center">Lead Not Found</div>;

  const scoreBreakdown = lead.score_breakdown || {};

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Center
        </Button>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 ml-auto" onClick={() => navigate(`/admin/account-intelligence/${id}`)}>
          <Brain className="mr-2 h-4 w-4" /> Open Intelligence Workspace
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{lead.lead_title || "Unnamed Lead"}</h1>
            <Badge variant={lead.status === 'APPROVED' ? 'default' : lead.status === 'REJECTED' ? 'destructive' : 'secondary'}>
              {lead.status}
            </Badge>
            {lead.template_id && (
              <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 bg-indigo-500/10">
                Template: {lead.template_name || 'Unknown'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building className="h-4 w-4" /> {lead.company_name || 'No Company Name'}
          </p>
        </div>

        <div className="flex gap-2">
          {lead.status !== 'APPROVED' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus('APPROVED')}>
              <Check className="mr-2 h-4 w-4" /> Approve Lead
            </Button>
          )}
          {lead.status !== 'REJECTED' && (
            <Button variant="destructive" onClick={() => handleUpdateStatus('REJECTED')}>
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-400" /> Extracted Entities</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Tag className="h-3 w-3" /> Lead Type</p>
                <p className="font-medium">{lead.lead_type || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Industry</p>
                <p className="font-medium">{lead.industry || 'Unknown'} {lead.sub_industry ? `(${lead.sub_industry})` : ''}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><MapPin className="h-3 w-3" /> Location</p>
                <p className="font-medium">{[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Project Name</p>
                <p className="font-medium">{lead.project_name || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-purple-400" /> Contact & Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Mail className="h-3 w-3" /> Email</p>
                  <p className="font-medium">{lead.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Phone className="h-3 w-3" /> Phone</p>
                  <p className="font-medium">{lead.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Globe className="h-3 w-3" /> Website</p>
                  <p className="font-medium">{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{lead.website}</a> : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Shield className="h-3 w-3" /> Contact Person</p>
                  <p className="font-medium">{lead.contact_person || 'N/A'}</p>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm leading-relaxed">{lead.description || 'No description provided.'}</p>
              </div>
            </CardContent>
          </Card>

          {/* CUSTOM FIELDS FROM TEMPLATE */}
          {lead.raw_import && Object.keys(lead.raw_import).filter(key => 
            !['project_name', 'company_name', 'contact_person', 'phone', 'email', 'website', 'industry', 'sub_industry', 'city', 'state', 'country', 'description', 'requirement', 'lead_type', 'budget'].includes(key)
          ).length > 0 && (
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5 text-indigo-400" /> Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(lead.raw_import)
                    .filter(([key]) => !['project_name', 'company_name', 'contact_person', 'phone', 'email', 'website', 'industry', 'sub_industry', 'city', 'state', 'country', 'description', 'requirement', 'lead_type', 'budget'].includes(key))
                    .map(([key, val]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="font-medium">{val ? String(val) : 'N/A'}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: Scoring & Raw Data */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-yellow-400" /> Intelligence Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-black text-blue-400">{lead.score || 0}</span>
                <span className="text-muted-foreground pb-1">/ 100</span>
                <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-400 border-blue-500/20 text-lg py-1 px-3">
                  {lead.tier || 'UNRATED'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score Breakdown</p>
                {Object.keys(scoreBreakdown).length > 0 ? (
                  Object.entries(scoreBreakdown).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-white">+{val}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No breakdown available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-emerald-400" /> Raw Import Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                This is the original unstructured data that was ingested before Entity Extraction.
              </p>
              <div className="bg-black/60 p-3 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
                <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap">
                  {lead.raw_import ? JSON.stringify(lead.raw_import, null, 2) : 'No raw data saved.'}
                </pre>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
