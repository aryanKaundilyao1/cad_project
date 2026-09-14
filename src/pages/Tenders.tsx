import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, MapPin, Search, ChevronDown, Sparkles, ShieldAlert, ArrowRight, Globe, CheckCircle2,
  SlidersHorizontal, RefreshCw, LayoutGrid, Database, DownloadCloud, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIndustries } from "@/hooks/useBusinessProfile";
import { useBusinessProfileContext } from "@/contexts/BusinessProfileContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { trackEvent } from "@/utils/analytics";
import { formatDistanceToNow } from 'date-fns';

const Tenders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, user } = useAuth() as any;

  // View State: 'hub' or 'database'
  const [viewMode, setViewMode] = useState<'hub' | 'database'>('hub');
  const [refinementStats, setRefinementStats] = useState<any>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [subNicheFilter, setSubNicheFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [highIntentOnly, setHighIntentOnly] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Location suggestions Autocomplete state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === "") return;
    const timer = setTimeout(() => {
      trackEvent('search_performed', { search_term: searchTerm });
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: industries } = useIndustries();
  const { businessProfile, needsOnboarding, industryName, isLoading: bpLoading } = useBusinessProfileContext();
  const userIndustryId = businessProfile?.industry_id;

  // Realtime Active Viewers
  useEffect(() => {
    if (!profile?.id) return;
  }, [profile?.id]);

  const handleLeadClick = async (lead: any) => {
    navigate('/lead/' + lead.id);
  };

  const isOnboardedUser = profile?.onboarding_completed === true;

  if (user && !bpLoading && needsOnboarding) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 pt-16 flex items-center justify-center bg-background">
          <div className="text-center max-w-lg px-4">
            <h1 className="text-2xl font-bold mb-3">Complete Your Business Profile</h1>
            <Button onClick={() => navigate("/onboarding")} className="mt-4">
              Complete Profile <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch Leads with Pagination
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", searchTerm, locationFilter, budgetFilter, userIndustryId, subNicheFilter, verifiedOnly, highIntentOnly, recentlyUpdated, page, pageSize],
    queryFn: async () => {
      let query = supabase.from("leads").select("*", { count: "exact" })
        .in("status", ["Planning", "Active", "Negotiation"])
        .eq("is_public", true);

      if (userIndustryId) query = query.eq("industry_id", userIndustryId);
      if (verifiedOnly) query = query.eq("is_verified", true);
      if (highIntentOnly) query = query.gte("intent_score", 70);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (locationFilter) {
        query = query.or(`location.ilike.%${locationFilter}%,city.ilike.%${locationFilter}%,country.ilike.%${locationFilter}%`);
      }
      if (budgetFilter && budgetFilter !== 'all') {
        if (budgetFilter === 'high') query = query.gte('budget_max', 50000);
        else if (budgetFilter === 'medium') { query = query.gte('budget_max', 10000); query = query.lte('budget_max', 50000); }
        else if (budgetFilter === 'low') query = query.lte('budget_max', 10000);
      }

      // Pagination calculation
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order("quality_score", { ascending: false, nullsLast: true })
        .order("approved_at", { ascending: false, nullsFirst: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      setTotalCount(count || 0);
      return data || [];
    },
    enabled: viewMode === 'database' // Only fetch heavily when in database view
  });

  const { data: importHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['importHistory', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { count: 0, lastImport: null, recent: [] };
      const { data, error, count } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('source', 'Lead Database Import')
        .eq('workspace_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return {
        count: count || 0,
        lastImport: data && data.length > 0 ? data[0].created_at : null,
        recent: data ? data.slice(0, 5) : []
      };
    },
    enabled: viewMode === 'hub' && !!profile?.id
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <div className="flex-1 pt-16">
        
        {/* Header Region */}
        <section className="py-8 border-b bg-card">
          <div className="w-full max-w-[1600px] mx-auto px-6">
            <h1 className="text-3xl font-bold mb-2">Lead Discovery</h1>
            <p className="text-muted-foreground">Discover, select, and import verified opportunities directly into your CRM.</p>
          </div>
        </section>

        {viewMode === 'hub' ? (
          // ================= HUB VIEW =================
          <div className="w-full max-w-[1600px] mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Section 1: Find New Opportunities */}
              <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-8 shadow-sm flex flex-col items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 relative z-10">
                  <Database className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-3 relative z-10">Find New Opportunities</h2>
                <p className="text-muted-foreground mb-8 max-w-sm relative z-10">
                  Browse thousands of verified opportunities, filter by your specific industry niche, location, and import them directly into your active CRM pipeline.
                </p>
                <Button onClick={() => setViewMode('database')} className="relative z-10 bg-primary text-primary-foreground">
                  Browse Lead Database <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Section 2: Import History */}
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold">Import History</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Total Imported</p>
                    <p className="text-3xl font-bold">{loadingHistory ? '...' : (importHistory?.count || 0)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Last Import</p>
                    <p className="text-3xl font-bold text-emerald-500">
                      {loadingHistory ? '...' : (importHistory?.lastImport ? formatDistanceToNow(new Date(importHistory.lastImport), { addSuffix: true }) : 'Never')}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Recent Imports</h3>
                  <div className="space-y-3">
                    {loadingHistory ? (
                      <p className="text-sm text-muted-foreground">Loading recent imports...</p>
                    ) : importHistory?.recent?.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No imports yet.</p>
                    ) : (
                      importHistory?.recent.map((opp) => (
                        <div key={opp.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer" onClick={() => navigate('/opportunities')}>
                          <div>
                            <p className="font-medium">{opp.title}</p>
                            <p className="text-xs text-muted-foreground">Imported {opp.created_at ? formatDistanceToNow(new Date(opp.created_at), { addSuffix: true }) : ''}</p>
                          </div>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          // ================= DATABASE VIEW =================
          <>
            <div className="border-b bg-card/80 backdrop-blur sticky top-16 z-30">
              <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setViewMode('hub')} className="text-muted-foreground">
                  ← Back to Hub
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-1.5 border border-border">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search leads..." 
                      className="bg-transparent border-none outline-none text-sm w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-3 py-1.5 border border-border">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Location..." 
                      className="bg-transparent border-none outline-none text-sm w-[150px]"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>

                  <Select value={budgetFilter} onValueChange={(v) => setBudgetFilter(v)}>
                    <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Budget" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Budgets</SelectItem>
                      <SelectItem value="high">$50k+</SelectItem>
                      <SelectItem value="medium">$10k - $50k</SelectItem>
                      <SelectItem value="low">Under $10k</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="w-px h-6 bg-border mx-2"></div>



                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Per page" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="w-full max-w-[1600px] mx-auto px-6 py-6 pb-32 relative">
              {/* Refinement Stats Alert */}
              <AnimatePresence>
                {refinementStats && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="sticky top-[140px] z-40 mb-4 bg-emerald-500/10 border border-emerald-500/20 shadow-xl rounded-xl px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Refinement Complete</h3>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80">
                          Analyzed {refinementStats.analyzed} leads. 
                          Found {refinementStats.qualified} matches. 
                          Discarded {refinementStats.discarded} irrelevant leads.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2" 
                      onClick={() => navigate('/opportunities')}
                    >
                      View Opportunities <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden relative z-10">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Opportunity</th>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Industry</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Marketplace Status</th>
                      <th className="px-6 py-4">Last Updated</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Data Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr><td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">Loading leads...</td></tr>
                    ) : leads?.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">No leads found matching your criteria.</td></tr>
                    ) : leads?.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={(e) => {
                          handleLeadClick(lead);
                        }}
                      >
                        <td className="px-6 py-4 font-medium max-w-[200px] truncate text-primary group-hover:underline">{lead.title}</td>
                        <td className="px-6 py-4 text-muted-foreground max-w-[150px] truncate">{lead.company_name || 'Verified Client'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{lead.location || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{lead.industry || '—'}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {lead.oie_score?.explanation_bullets ? (
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge className="bg-primary/20 text-primary border-primary/30 cursor-help transition-colors hover:bg-primary/30">
                                  {lead.oie_score.lead_score ?? lead.quality_score ?? lead.current_score ?? 'N/A'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80 p-4" align="start">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm border-b pb-1">Score Breakdown</h4>
                                  <ul className="text-xs text-muted-foreground space-y-2 pl-3 list-none">
                                    {lead.oie_score.explanation_bullets.map((bullet: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed whitespace-pre-wrap">{bullet}</li>
                                    ))}
                                  </ul>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              {lead.quality_score || lead.current_score || lead.intent_score || 'N/A'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            lead.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            lead.status === 'Planning' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            lead.status === 'Negotiation' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-muted/10 text-muted-foreground border-muted/20'
                          }>
                            {lead.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{lead.source || 'Manual Upload'}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{lead.icp_tier || 'Unknown'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <span className="text-sm px-4">Page {page}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount}>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Tenders;
