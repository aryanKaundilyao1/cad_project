import React, { useEffect, useState } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Box, Map, TrendingUp, DollarSign, Users, Target, ArrowRight, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const WorkspaceProductDashboard = () => {
  const { activeProduct, company } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, units: 0, campaigns: 0 });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [outreachPlan, setOutreachPlan] = useState<any>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProduct) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Leads mapped to this product via assigned_leads table
        const { data: assignmentsData } = await supabase
          .from('assigned_leads')
          .select('*, leads(*)')
          .eq('product_id', activeProduct.id)
          .order('assigned_date', { ascending: false });

        const assignments = assignmentsData || [];
        
        // Flatten leads using the new current_score snapshot for performance
        const leads = assignments.map(a => {
          return {
            ...a.leads,
            assignment_id: a.id,
            score: a.leads?.current_score || 0,
            confidence: a.leads?.current_confidence || 'Unknown'
          };
        }).filter(l => l.id && l.status !== 'Closed');
        
        const opps = leads.filter(l => l.source !== 'Marketplace' && l.source !== 'Client').sort((a, b) => b.score - a.score);
        const enqs = leads.filter(l => l.source === 'Marketplace' || l.source === 'Client');

        setOpportunities(opps);
        setEnquiries(enqs);

        // Fetch Campaigns mapped to this product
        const { count: campaignsCount } = await supabase
          .from('client_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', activeProduct.id);

        setStats({
          revenue: activeProduct.estimated_revenue || 0,
          units: activeProduct.units_sold_count || 0,
          campaigns: campaignsCount || 0,
          orders: opps.filter(o => o.status === 'Won' || o.lifecycle_stage === 'Won').length || 0 // Assuming 'Won' opportunities represent orders
        });

        // Fetch Tasks related to these leads
        const leadIds = leads.map(l => l.id);
        let dbTasks = [];
        if (leadIds.length > 0) {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .in('opportunity_id', leadIds)
            .order('created_at', { ascending: false })
            .limit(5);
          dbTasks = tasksData || [];
        }
        
        // Auto-generate strategy tasks for high scoring leads
        const highScoringLeads = leads.filter(l => l.score >= 80 && l.assignment_status !== 'Contacted' && l.assignment_status !== 'Meeting Booked' && l.assignment_status !== 'Quotation Sent' && l.assignment_status !== 'Negotiation' && l.assignment_status !== 'Won');
        const autoTasks = highScoringLeads.map(l => ({
          id: `auto-${l.id}`,
          title: `Outreach High-Confidence Lead - ${l.company_name || l.title}`,
          status: 'Pending',
          task_type: 'lead_strategy',
          lead_id: l.id
        }));

        setActiveTasks([...autoTasks, ...dbTasks].slice(0, 10));

      } catch (err) {
        console.error("Failed to fetch product dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Setup Realtime Subscriptions
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_leads' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProduct]);

  if (!activeProduct) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No product selected. Please select a product from the sidebar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{activeProduct.name}</h1>
            <Badge variant={activeProduct.approval_status === 'approved' ? 'default' : 'secondary'} className={activeProduct.approval_status === 'approved' ? 'bg-emerald-600' : ''}>
              {activeProduct.approval_status === 'approved' ? 'Live on Marketplace' : 'Pending Review'}
            </Badge>
            <Badge variant="outline" className="uppercase text-[10px]">{activeProduct.product_type?.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{activeProduct.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
            onClick={async () => {
              setIsGeneratingPlan(true);
              try {
                const response = await fetch(`/api/run-oie?productId=${activeProduct.id}`);
                if (!response.ok) throw new Error("Failed to generate plan");
                const data = await response.json();
                
                if (data.results && data.results.length > 0 && company) {
                  // Prepare bulk insert
                  const assignments = data.results.map((r: any) => ({
                    lead_id: r.company_id,
                    client_id: company.id,
                    product_id: activeProduct.id,
                    lifecycle_stage: 'Base Scored',
                    status: 'New',
                    is_contacted: false
                  }));

                  const opportunities = data.results.map((r: any) => ({
                    legacy_lead_id: r.company_id,
                    title: r.company_name,
                    workspace_id: company.id,
                    lifecycle_stage: 'Base Scored',
                    sales_status: 'New',
                    stage: 'discovery',
                    created_by: company.id
                  }));

                  // Perform inserts (ignore duplicates if they exist)
                  await supabase.from('assigned_leads').upsert(assignments, { onConflict: 'lead_id, product_id, client_id', ignoreDuplicates: true });
                  await supabase.from('opportunities').upsert(opportunities, { onConflict: 'legacy_lead_id, workspace_id', ignoreDuplicates: true });
                }

                setOutreachPlan(data);
              } catch (error) {
                console.error("Error generating outreach plan:", error);
              } finally {
                setIsGeneratingPlan(false);
              }
            }}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Generate Today's Outreach Plan
          </Button>
          <Link to={`/workspace/catalogue/${activeProduct.id}/edit`}>
            <Button variant="outline" className="gap-2"><Box className="h-4 w-4"/> Edit Details</Button>
          </Link>
        </div>
      </div>

      {/* OIE Outreach Plan Results */}
      {(outreachPlan && outreachPlan.summary && outreachPlan.results) && (
        <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Today's Opportunity Intelligence Plan
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Freshly analysed by the Opportunity Intelligence Engine. Highly recommended to execute immediately.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-indigo-500/10 border-indigo-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-300">Leads Analysed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-100">{outreachPlan.summary.leads_analyzed}</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-300">High Priority (Tier 1)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-100">{outreachPlan.summary.high_priority}</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-300">Medium Priority (Tier 2)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-100">{outreachPlan.summary.medium_priority}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{outreachPlan.summary.average_score}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 shadow-lg overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="text-lg">Ranked Outreach List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {outreachPlan.results.slice(0, 10).map((opp: any) => (
                  <div key={opp.company_id} className="group">
                    <div 
                      className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setExpandedRowId(expandedRowId === opp.company_id ? null : opp.company_id)}
                    >
                      <div className="flex items-center gap-4 w-1/3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                          #{opp.rank}
                        </div>
                        <div>
                          <h4 className="font-semibold">{opp.company_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              {opp.tier}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Score: {opp.total_score}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-1/3 px-4">
                        <p className="text-sm font-medium text-foreground">{opp.recommended_action}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-white/5">Confidence: {opp.confidence}</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <ArrowRight className={`h-4 w-4 transition-transform ${expandedRowId === opp.company_id ? 'rotate-90' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    
                    {expandedRowId === opp.company_id && (
                      <div className="p-6 bg-white/[0.01] border-t border-white/5">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h5 className="font-semibold text-sm mb-3 text-indigo-300">Why are we recommending this?</h5>
                            <ul className="space-y-2">
                              {opp.reasons.map((reason: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-semibold text-sm mb-3 text-emerald-300">Quick Context</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Industry</span>
                                <span className="font-medium">{opp.evidence?.industry || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Region</span>
                                <span className="font-medium">{opp.evidence?.region || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Website</span>
                                <span className="font-medium text-blue-400 hover:underline">
                                  {opp.contact_info?.website || 'N/A'}
                                </span>
                              </div>
                              <div className="pt-3 mt-3 border-t border-white/5">
                                <Link to={`/lead/${opp.company_id}`}>
                                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    View Full Profile & Contact
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <div className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
              Based on closed/won opportunities
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Locked</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <div className="text-xs text-muted-foreground mt-2">Active opportunities in pipeline</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meetings Booked</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.filter((t: any) => t.task_type === 'meeting').length}</div>
            <div className="text-xs text-muted-foreground mt-2">Upcoming product demonstrations</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Leads & Enquiries */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary"/> Top Opportunities</CardTitle>
                  <CardDescription className="text-primary/70">High-intent leads identified and scored by the Intelligence Engine.</CardDescription>
                </div>
                {opportunities.length > 0 && <Badge>{opportunities.length}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {opportunities.length === 0 ? (
                <div className="p-8 text-center text-primary/60 italic text-sm">
                  No opportunities have been mapped to this product yet.
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {opportunities.slice(0, 5).map(opp => (
                    <div key={opp.id} className="p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm">
                          {opp.score || 95}
                        </div>
                        <div>
                          <h4 className="font-semibold">{opp.title}</h4>
                          <p className="text-xs text-primary/70">{opp.location || 'Unknown Location'} • Budget: ₹{opp.budget_min?.toLocaleString() || 'N/A'} - ₹{opp.budget_max?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                      <Link to={`/lead/${opp.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/20"><ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              {opportunities.length > 5 && (
                <div className="p-3 text-center border-t border-primary/10">
                  <Link to={`/workspace/product/${activeProduct.id}/leads`} className="text-sm text-primary font-medium hover:underline">View All {opportunities.length} Opportunities</Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/10">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-amber-500"/> Marketplace Enquiries</CardTitle>
                  <CardDescription>Direct inbound requests and public marketplace enquiries.</CardDescription>
                </div>
                {enquiries.length > 0 && <Badge variant="secondary">{enquiries.length}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {enquiries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic text-sm">
                  No marketplace enquiries received yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {enquiries.slice(0, 5).map(enq => (
                    <div key={enq.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div>
                        <h4 className="font-semibold text-sm">{enq.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Status: {enq.status} • {new Date(enq.created_at).toLocaleDateString()}</p>
                      </div>
                      <Link to={`/workspace/product/${activeProduct.id}/enquiries`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights & Analytics */}
        <div className="space-y-6">
          <Card className="shadow-sm border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5 text-indigo-400" /> Market Insights</CardTitle>
              <CardDescription>Live trade statistics and demand signals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-center">
                <Info className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <h4 className="font-semibold text-indigo-300">No Market Insights Available</h4>
                <p className="text-xs text-indigo-400/80 mt-1">Connect a data source or wait for the engine to aggregate trade statistics for this specific product.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tasks & Lead Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-white/10 rounded-lg text-muted-foreground text-sm">
                  No active tasks or meetings scheduled for this product.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map(task => (
                    <div key={task.id} className="flex flex-col gap-1 p-3 bg-white/5 rounded-md border border-white/5">
                      <div className="flex items-center justify-between">
                        {task.lead_id ? (
                          <Link to={`/lead/${task.lead_id}`} className="font-semibold text-sm hover:underline hover:text-indigo-400">
                            {task.title}
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm">{task.title}</span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{task.task_type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceProductDashboard;
