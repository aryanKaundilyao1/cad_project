import React, { useState } from 'react';
import { Target, Search, Clock, ArrowRight, Activity, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const TABS = [
  { id: 'T1', label: 'T1 Core', desc: 'Highest Quality & Intent' },
  { id: 'T2', label: 'T2 Adjacent', desc: 'Moderate Fit' },
  { id: 'T3', label: 'T3 Nurture', desc: 'Limited Data' },
  { id: 'UNSCORED', label: 'Unscored', desc: 'Missing OIE Data' },
];

const SALES_STATUSES = [
  'New',
  'Connected',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'Closed',
  'No Response',
  'Follow-up Required'
];

export default function DiscoveryWorkspace() {
  const { profile, user } = useAuth() as any;
  const currentWorkspaceId = user?.id || profile?.user_id || profile?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('T1');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch opportunities
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['discovery_opportunities', currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, account:accounts(name), leads(*), opportunity_scores(*)')
        .eq('workspace_id', currentWorkspaceId)
        .order('lead_score', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspaceId,
    refetchInterval: 30000,
  });

  const parseMeta = (meta: any) => typeof meta === 'string' ? JSON.parse(meta) : meta;
  const extractLeadMeta = (opp: any) => {
    const lead = Array.isArray(opp.leads) ? opp.leads[0] : opp.leads;
    if (!lead) return null;
    return parseMeta(lead.metadata);
  };
  const getOppTier = (opp: any) => {
    const meta = extractLeadMeta(opp);
    return opp.icp_tier || 
           opp.opportunity_scores?.[0]?.score_breakdown?.icp_tier || 
           meta?.oie_score?.icp_tier || 
           opp.opportunity_scores?.[0]?.score_breakdown?.data_tier || 
           'UNSCORED';
  };
  const getOppScore = (opp: any) => {
    const meta = extractLeadMeta(opp);
    return opp.lead_score || 
           opp.opportunity_scores?.[0]?.score_breakdown?.lead_score || 
           meta?.oie_score?.lead_score || 
           0;
  };

  // Filter opportunities
  const filteredOpps = React.useMemo(() => {
    let base = opportunities.filter((o: any) => getOppTier(o) === activeTab);
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      base = base.filter((o: any) => 
        (o.title || '').toLowerCase().includes(q) ||
        (o.account?.name || '').toLowerCase().includes(q) ||
        (o.leads?.industry || '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [opportunities, activeTab, searchTerm]);

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('opportunities')
        .update({ sales_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery_opportunities'] });
      toast.success('Status updated');
    },
    onError: (err: any) => {
      toast.error('Failed to update status', { description: err.message });
    }
  });

  const getTierBadgeProps = (tier: string) => {
    if (tier === 'T1') return { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (tier === 'T2') return { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    if (tier === 'T3') return { className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 dark:bg-[#0A0A0A] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-8 h-8 text-indigo-500" />
              Discovery Workspace
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Explore your pre-scored, high-intent opportunities sorted by ICP Tier.
            </p>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-white dark:bg-[#111] p-1 border border-border rounded-lg shadow-sm w-full sm:w-auto overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all
                  ${activeTab === tab.id 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-white/5'}
                `}
              >
                {tab.id} - {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              className="pl-9 bg-white dark:bg-[#111]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lead Table */}
        <Card className="bg-white dark:bg-[#111] border-border shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center text-muted-foreground">
                <Activity className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredOpps.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <Target className="w-12 h-12 mb-3 opacity-20" />
                <p>No {activeTab} leads found.</p>
                <p className="text-sm">Adjust your search or contact your admin to upload a new dataset.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[120px]">Score</TableHead>
                    <TableHead className="w-[120px]">Tier</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[200px]">Sales Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpps.map((opp: any) => (
                    <TableRow key={opp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] border-border">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {opp.title || opp.account?.name || 'Unknown Company'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {opp.leads?.industry || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {opp.leads?.location || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {(() => {
                              if (getOppTier(opp) === 'UNSCORED') {
                                console.log("UNSCORED OPP:", { 
                                  id: opp.id, 
                                  icp_tier: opp.icp_tier,
                                  leads_type: Array.isArray(opp.leads) ? 'array' : typeof opp.leads,
                                  leads: opp.leads,
                                  opp_scores: opp.opportunity_scores
                                });
                              }
                              return getOppScore(opp);
                            })()}
                          </span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" {...getTierBadgeProps(getOppTier(opp))}>
                          {getOppTier(opp)} {getOppTier(opp) !== 'UNSCORED' ? 'Core' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {opp.leads?.source_file ? (
                          <span className="truncate max-w-[150px] inline-block" title={opp.leads.source_file}>
                            {opp.leads.source_file}
                          </span>
                        ) : 'System'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={opp.sales_status || 'New'} 
                          onValueChange={(val) => updateStatusMutation.mutate({ id: opp.id, status: val })}
                        >
                          <SelectTrigger className="h-8 bg-transparent border-border text-xs w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SALES_STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-indigo-400"
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
