import React, { useState, useEffect } from 'react';
import { Target, Search, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function OpportunitiesPage() {
  const { user, profile } = useAuth() as any;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Realtime Subscription for Leads
  useEffect(() => {
    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['priority_leads'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch ALL Leads for the workspace to build the Priority Feed
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['priority_leads', profile?.id || user?.id, searchTerm],
    queryFn: async () => {
      const fetchId = profile?.id || user?.id;
      if (!fetchId) return [];
      
      // Query leads directly
      let query = supabase
        .from('leads')
        .select(`
          id,
          company_name,
          current_score,
          current_confidence,
          industry,
          country,
          contact_name,
          owner_name,
          updated_at,
          research_completeness,
          metadata,
          source_type,
          source
        `)
        .eq('seller_id', fetchId);

      if (searchTerm) {
        query = query.ilike('company_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let validLeads = data as any[];
      
      // 3. DIFFERENTIATE LEADS WITH IDENTICAL SCORES (Multi-level deterministic sort)
      validLeads.sort((a, b) => {
        // 0th: Live Enquiries (Absolute Top Priority)
        const isLiveA = a.source_type === 'live_enquiry' || a.source === 'website' || a.source === 'Live Request' ? 1 : 0;
        const isLiveB = b.source_type === 'live_enquiry' || b.source === 'website' || b.source === 'Live Request' ? 1 : 0;
        if (isLiveA !== isLiveB) return isLiveB - isLiveA;

        // 1st: Overall OIE Score
        const scoreDiff = (b.current_score || 0) - (a.current_score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        // Extract metadata for deeper sorting
        const metaA = a.metadata || {};
        const metaB = b.metadata || {};

        // 2nd: Product Fit (If we had product fit scores separately, otherwise skip or use base)
        const fitA = metaA.oie_score?.fit_score || 0;
        const fitB = metaB.oie_score?.fit_score || 0;
        if (fitB !== fitA) return fitB - fitA;

        // 3rd: Industry Match (Simple heuristic: presence of industry)
        const indA = a.industry ? 1 : 0;
        const indB = b.industry ? 1 : 0;
        if (indB !== indA) return indB - indA;

        // 4th: Review Count
        const revA = Number(metaA.reviews) || 0;
        const revB = Number(metaB.reviews) || 0;
        if (revB !== revA) return revB - revA;

        // 5th: Google Rating
        const ratA = Number(metaA.rating) || 0;
        const ratB = Number(metaB.rating) || 0;
        if (ratB !== ratA) return ratB - ratA;

        // 6th: Data Completeness
        const compA = a.research_completeness || 0;
        const compB = b.research_completeness || 0;
        if (compB !== compA) return compB - compA;

        // 7th: Website Present
        const webA = metaA.website ? 1 : 0;
        const webB = metaB.website ? 1 : 0;
        if (webB !== webA) return webB - webA;

        // 8th: Phone Present
        const phoneA = metaA.phone ? 1 : 0;
        const phoneB = metaB.phone ? 1 : 0;
        if (phoneB !== phoneA) return phoneB - phoneA;

        // 9th: Most Recently Updated
        const timeA = new Date(a.updated_at || 0).getTime();
        const timeB = new Date(b.updated_at || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;

        // 10th: Alphabetical
        const nameA = (a.company_name || '').toLowerCase();
        const nameB = (b.company_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      return validLeads;
    },
    enabled: !!user?.id
  });

  return (
    <div className="h-full bg-background flex flex-col overflow-y-auto">
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-8 flex flex-col gap-6 pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Priority Opportunity Feed
            </h1>
            <p className="text-muted-foreground mt-1">
              Your real-time pipeline of all leads sorted dynamically by Opportunity Intelligence.
            </p>
          </div>
        </div>

        {/* Lead List Enhancements */}
        <div className="bg-card border border-white/10 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-white/10 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Showing All {leads.length} Active Leads
            </Badge>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-4">Company Name</th>
                  <th className="px-4 py-4 text-center">OIE Score</th>
                  <th className="px-4 py-4">Confidence</th>
                  <th className="px-4 py-4">Contact Details</th>
                  <th className="px-4 py-4">Industry / Country</th>
                  <th className="px-4 py-4">Decision Maker</th>
                  <th className="px-4 py-4">Completeness</th>
                  <th className="px-4 py-4">Recommended Action</th>
                  <th className="px-4 py-4">Updated</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : leads?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                      <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>No leads found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  leads?.map((l: any, idx: number) => {
                    const isDecisionMakerIdentified = l.metadata?.decision_makers && l.metadata.decision_makers.length > 0;
                    
                    // Derive Priority Badge based on score
                    let priorityBadge = <Badge className="bg-slate-500/20 text-slate-300">Low Priority</Badge>;
                    if (l.current_score >= 80) priorityBadge = <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">Critical Target</Badge>;
                    else if (l.current_score >= 60) priorityBadge = <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">High Priority</Badge>;
                    else if (l.current_score >= 40) priorityBadge = <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Medium Priority</Badge>;

                    const completeness = l.research_completeness || 0;

                    return (
                      <tr key={l.id} className="transition-colors group hover:bg-white/[0.01]">
                        <td className="px-4 py-4 font-medium text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm truncate max-w-[150px]">{l.company_name}</div>
                            <div className="mt-1">{priorityBadge}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-lg text-primary">
                          {l.current_score || 0}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="capitalize text-xs">
                            {l.current_confidence || 'Unknown'}
                          </Badge>
                        </td>
                                                <td className="px-4 py-4 text-muted-foreground text-xs">
                          {(() => {
                            const meta = l.metadata || {};
                            const extractString = (val: any) => {
                              if (!val) return '';
                              if (Array.isArray(val)) return val.length > 0 ? String(val[0]) : '';
                              return String(val);
                            };
                            const phone = l.phone || extractString(meta.phone || meta.phones || meta.mobile || meta.contact_number || meta.telephone || meta['Phone Number'] || meta['phone number'] || meta.phoneNumber || meta.phone_number);
                            const email = l.email || extractString(meta.email || meta.emails || meta.email_address || meta.contact_email);
                            return (
                              <div className="space-y-1">
                                {phone ? <div className="truncate max-w-[150px] text-primary flex items-center gap-1"><span className="w-3 h-3 block opacity-50">📞</span> {phone}</div> : <div className="text-white/20 italic">No Phone</div>}
                                {email ? <div className="truncate max-w-[150px] text-blue-400 flex items-center gap-1"><span className="w-3 h-3 block opacity-50">✉️</span> {email}</div> : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          <div className="truncate max-w-[120px]">{l.industry || '-'}</div>
                          <div className="truncate max-w-[120px] mt-0.5">{l.country || '-'}</div>
                        </td>
                        <td className="px-4 py-4">
                          {isDecisionMakerIdentified ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Identified</span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs"><X className="w-3 h-3" /> Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 w-24">
                            <Progress value={completeness} className="h-1.5 bg-white/5" />
                            <span className="text-xs text-muted-foreground">{completeness}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <span className="text-amber-400 truncate max-w-[120px] block font-medium">
                            {l.current_score > 70 ? 'Send Pitch Deck' : l.current_score > 40 ? 'Enrich Contact' : 'Monitor'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          {l.updated_at ? format(new Date(l.updated_at), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" onClick={() => navigate(`/lead/${l.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
                            View Profile <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
