import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, BrainCircuit, Play, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLeadUpload from './AdminLeadUpload';
import { DeduplicationEngine } from '@/lib/deduplicationEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminLeadIntelligenceCenter() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [permanentLeads, setPermanentLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('registry');
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null);

  useEffect(() => {
    if (activeTab !== 'upload') {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rawData, error: rawError } = await supabase
        .from('raw_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!rawError && rawData) {
        setLeads(rawData);
      }

      const { data: permData, error: permError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!permError && permData) {
        setPermanentLeads(permData);
      }

      const { data: analyticsData, error: anError } = await supabase
        .from('raw_leads_analytics')
        .select('*');

      if (!anError && analyticsData) {
        setAnalytics(analyticsData);
      }

    } catch (err) {
      console.error("Error fetching Lead Intel data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeads = async () => {
    setProcessing(true);
    try {
      const result = await DeduplicationEngine.processAllPendingLeads();
      toast({ 
        title: 'Processing Complete', 
        description: `Successfully processed ${result.processed} leads. Found ${result.duplicates} duplicates.` 
      });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Processing Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (lead: any) => {
    setApproving(lead.id);
    try {
      // Phase 9: Move to main CRM Leads database
      const metadata = {
        project_name: lead.project_name,
        project_stage: lead.project_stage,
        project_cost: lead.project_cost,
        capacity: lead.capacity,
        lead_type: lead.lead_type
      };

      const { data: insertedLead, error: insertError } = await supabase.from('leads').insert([{
        title: lead.project_name || lead.company_name || 'New Lead',
        company_name: lead.company_name,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        country: lead.country,
        city: lead.city,
        address: lead.address,
        description: lead.description || lead.notes,
        source: lead.source,
        tier: lead.tier,
        quality_score: lead.score,
        employee_count: lead.company_size,
        lead_status: 'active',
        is_verified: true,
        verification_status: 'verified',
        location: lead.project_location || lead.country || 'Global',
        metadata: metadata
      }]);

      if (insertError) throw insertError;

      // Update raw_leads status
      await supabase.from('raw_leads').update({ status: 'APPROVED' }).eq('id', lead.id);

      toast({ title: 'Lead Approved', description: 'Lead successfully routed to customer CRM.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Approval Failed', description: err.message, variant: 'destructive' });
    } finally {
      setApproving(null);
    }
  };

  const handleRecalculateHistorical = async () => {
    if (!window.confirm("WARNING: This will reprocess ALL existing leads, overwriting their titles, extracting entities, and recalculating scores. Are you sure?")) return;
    setProcessing(true);
    try {
      // 1. Reset all leads back to RAW so the Deduplication Engine will process them
      const { error: resetError } = await supabase.from('raw_leads').update({ status: 'RAW' }).neq('status', 'APPROVED');
      if (resetError) throw resetError;

      // 2. Run the normal process command
      const result = await DeduplicationEngine.processAllPendingLeads();
      toast({ 
        title: 'Historical Recalculation Complete', 
        description: `Successfully reprocessed ${result.processed} leads.` 
      });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Recalculation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ title: 'Export Failed', description: 'No data to export.', variant: 'destructive' });
      return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]).join(',');
    
    // Create CSV rows, handling commas and quotes in values
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (str.includes(',') || str.includes('\\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderLeadsTable = (filterStatus?: string) => {
    let filtered = leads;
    if (filterStatus) filtered = filtered.filter(l => l.status === filterStatus);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    
    if (filtered.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
          No leads found in this queue.
        </div>
      );
    }

    const showActions = ['T1', 'T2', 'T3'].includes(filterStatus || '');

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-muted-foreground">{filtered.length} Leads Found</h3>
          <Button variant="outline" size="sm" onClick={() => handleExportCSV(filtered, `jas_leads_${filterStatus || 'all'}`)} className="h-8">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Lead Details</th>
                <th className="px-4 py-3">Type & Industry</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Score</th>
                {showActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-white/[0.02]">
              {filtered.map((lead, idx) => (
                <tr key={idx} className="hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => navigate(`/admin/leads/${lead.id}`)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{lead.lead_title || lead.project_name || lead.company_name || 'Unknown Lead'}</div>
                    {lead.company_name && lead.lead_title !== lead.company_name && <div className="text-xs text-muted-foreground mt-0.5">{lead.company_name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {lead.lead_type && (
                        <Badge variant="outline" className="text-[10px] bg-white/5">
                          {lead.lead_type}
                        </Badge>
                      )}
                      {lead.industry && (
                        <div className="text-xs text-muted-foreground">{lead.industry}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      {lead.email && <div className="text-blue-400">{lead.email}</div>}
                      {lead.phone && <div className="text-green-400">{lead.phone}</div>}
                      {!lead.email && !lead.phone && <span className="text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex items-center gap-2">
                       <span className="font-medium">{lead.score || 0}</span>
                       {lead.score_breakdown && (
                         <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-white/10" onClick={() => setSelectedBreakdown(lead)}>
                           <FileText className="w-3.5 h-3.5" />
                         </Button>
                       )}
                     </div>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => { e.stopPropagation(); handleApprove(lead); }}
                        disabled={approving === lead.id}
                      >
                        {approving === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        Approve
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BrainCircuit className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Lead Intelligence Funnel</h2>
          <p className="text-sm text-muted-foreground">Polymorphic ingestion, flexible scoring, and CRM routing.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 flex w-full overflow-x-auto scrollbar-hide h-12 rounded-xl">
          <TabsTrigger value="registry" className="flex-1 min-w-[150px] rounded-lg text-blue-400 font-bold border border-blue-500/20 bg-blue-500/10">Live Module Registry</TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 min-w-[120px] rounded-lg">Upload Leads</TabsTrigger>
          <TabsTrigger value="raw" className="flex-1 min-w-[100px] rounded-lg">Raw Leads</TabsTrigger>
          <TabsTrigger value="processing" className="flex-1 min-w-[100px] rounded-lg">Processing</TabsTrigger>
          <TabsTrigger value="T1" className="flex-1 min-w-[80px] rounded-lg text-emerald-400">T1 Leads</TabsTrigger>
          <TabsTrigger value="T2" className="flex-1 min-w-[80px] rounded-lg text-yellow-400">T2 Leads</TabsTrigger>
          <TabsTrigger value="T3" className="flex-1 min-w-[80px] rounded-lg text-orange-400">T3 Leads</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 min-w-[100px] rounded-lg text-red-400">Rejected</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 min-w-[100px] rounded-lg text-blue-400">Approved</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-w-[120px] rounded-lg">Source Analytics</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="registry" className="mt-0 space-y-4">
            <div className="flex justify-between items-center bg-card/40 border border-white/5 p-4 rounded-xl">
              <div>
                <h3 className="font-semibold text-blue-400">Live Module Registry</h3>
                <p className="text-sm text-muted-foreground">Permanent unified view of active leads and their integrated modules.</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3">Lead ID</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-white/[0.02]">
                    {permanentLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.id}</td>
                        <td className="px-4 py-3 font-medium">{lead.company_name || lead.title}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">{lead.lead_status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/leads/modules/${lead.id}`)}>
                            View Evidence
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0 space-y-6">
            <AdminLeadUpload />
            
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400">Developer Tools</CardTitle>
                <CardDescription>Run historical data migrations and rebuilds.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleRecalculateHistorical} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Recalculate & Re-extract All Historical Leads
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This forces all non-approved leads through the new Entity Extraction and Scoring Engine pipeline.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="mt-0 space-y-4">
            <div className="flex justify-between items-center bg-card/40 border border-white/5 p-4 rounded-xl">
              <div>
                <h3 className="font-semibold">Raw Ingestion Queue</h3>
                <p className="text-sm text-muted-foreground">Leads waiting to be processed by the Refinement Engine.</p>
              </div>
              <Button onClick={handleProcessLeads} disabled={processing || leads.filter(l => ['RAW', 'PENDING'].includes(l.status)).length === 0} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Refinement Engine
              </Button>
            </div>
            {renderLeadsTable('RAW')}
            {renderLeadsTable('PENDING')}
          </TabsContent>

          <TabsContent value="processing" className="mt-0">
            {renderLeadsTable('PROCESSING')}
          </TabsContent>

          <TabsContent value="T1" className="mt-0">
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <h3 className="font-semibold text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Tier 1 Leads</h3>
              <p className="text-sm text-muted-foreground mt-1">High quality score (80-100). Ready for Admin Approval to push to CRM.</p>
            </div>
            {renderLeadsTable('T1')}
          </TabsContent>

          <TabsContent value="T2" className="mt-0">
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <h3 className="font-semibold text-yellow-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Tier 2 Leads</h3>
              <p className="text-sm text-muted-foreground mt-1">Medium quality score (60-79). Consider manual enrichment before approval.</p>
            </div>
            {renderLeadsTable('T2')}
          </TabsContent>

          <TabsContent value="T3" className="mt-0">
            <div className="mb-4 bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
              <h3 className="font-semibold text-orange-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Tier 3 Leads</h3>
              <p className="text-sm text-muted-foreground mt-1">Low quality score (40-59). May lack contact information.</p>
            </div>
            {renderLeadsTable('T3')}
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            {renderLeadsTable('REJECTED')}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-0">
            {renderLeadsTable('APPROVED')}
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Card className="bg-card/40 border-white/5">
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Funnel conversion metrics by lead source.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="source" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend />
                      <Bar dataKey="total_collected" name="Total Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_processing" name="Processing" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="t1_count" name="T1 Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_approved" name="Approved (CRM)" fill="#34d399" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Phase 11: Explainable Scoring Modal */}
      <Dialog open={!!selectedBreakdown} onOpenChange={(open) => !open && setSelectedBreakdown(null)}>
        <DialogContent className="bg-[#1a1b26] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Score Breakdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-semibold">Model Used:</span>
              <Badge variant="outline">{selectedBreakdown?.lead_type}</Badge>
            </div>
            
            <div className="space-y-2">
              {selectedBreakdown?.score_breakdown && Object.entries(selectedBreakdown.score_breakdown).map(([key, val]: any) => (
                <div key={key} className="flex justify-between text-sm items-center bg-white/5 p-2 rounded-md">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium text-blue-400">+{val} pts</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-lg">
              <span>Total Score:</span>
              <span>{selectedBreakdown?.score}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
