import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Users, Search, Filter, Download, ArrowRight, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { leadScoringService } from '@/services/leadScoringService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WorkspaceMyLeads = () => {
  const { products } = useWorkspace();
  const { productId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filters State
  const [filters, setFilters] = useState({
    country: "",
    city: "",
    category: "",
    source: "",
    scoreRange: "all",
    confidence: "all",
    crmStatus: "all"
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const activeProduct = products.find(p => p.id === productId);

  useEffect(() => {
    if (productId) {
      fetchLeads();
      
      const channel = supabase
        .channel('workspace-myleads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
          fetchLeads();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_leads' }, () => {
          fetchLeads();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [productId]);

  const fetchLeads = async () => {
    setLoading(true);
    
    // Fetch Leads assigned to this product
    const { data, error } = await supabase
      .from('assigned_leads')
      .select('*, leads(*)')
      .eq('product_id', productId)
      .order('assigned_date', { ascending: false });
      
    if (data) {
      // Flatten the result so the UI can consume it just like a normal lead
      const flattened = data.map((assignment: any) => ({
        ...assignment.leads,
        assignment_id: assignment.id,
        is_contacted: ['Contacted', 'Meeting Booked', 'Quotation Sent', 'Negotiation', 'Won'].includes(assignment.lifecycle_stage),
        assignment_status: assignment.lifecycle_stage || 'Imported',
        company_name: assignment.leads?.company_name || 'Unknown Company',
        contact_person: 'View Contacts Tab', // Contacts are now separate in Universal Identity
        country: assignment.leads?.country || 'Unknown',
        client_score: assignment.leads?.current_score || 0,
        product_id: assignment.product_id,
        client_id: assignment.client_id
      }));
      setLeads(flattened);
      
      // Auto-calculate missing scores
      const calcCount = await leadScoringService.autoCalculateMissingScores(flattened);
      if (calcCount > 0) {
        // Silently re-fetch to get new scores
        const { data: newData } = await supabase
          .from('assigned_leads')
          .select('*, leads(*)')
          .eq('product_id', productId)
          .order('assigned_date', { ascending: false });
          
        if (newData) {
          setLeads(newData.map((assignment: any) => ({
            ...assignment.leads,
            assignment_id: assignment.id,
            is_contacted: ['Contacted', 'Meeting Booked', 'Quotation Sent', 'Negotiation', 'Won'].includes(assignment.lifecycle_stage),
            assignment_status: assignment.lifecycle_stage || 'Imported',
            company_name: assignment.leads?.company_name || 'Unknown Company',
            contact_person: 'View Contacts Tab',
            country: assignment.leads?.country || 'Unknown',
            client_score: assignment.leads?.current_score || 0,
            product_id: assignment.product_id,
            client_id: assignment.client_id
          })));
        }
      }
    } else if (error) {
      console.error("Error fetching leads:", error);
    }
    setLoading(false);
  };

  if (!activeProduct) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No product selected or product not found.</p>
      </div>
    );
  }

  const filteredLeads = leads.filter(l => {
    // Search Query
    if (searchQuery && !(l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    
    // Country
    if (filters.country && (!l.country || !l.country.toLowerCase().includes(filters.country.toLowerCase()))) return false;
    
    // City
    if (filters.city && (!l.city || !l.city.toLowerCase().includes(filters.city.toLowerCase()))) return false;
    
    // Category (using industry as proxy if category isn't there)
    if (filters.category && (!l.industry || !l.industry.toLowerCase().includes(filters.category.toLowerCase()))) return false;
    
    // Source
    if (filters.source && (!l.source || !l.source.toLowerCase().includes(filters.source.toLowerCase()))) return false;
    
    // Score Range
    if (filters.scoreRange !== 'all') {
      const score = l.current_score || 0;
      if (filters.scoreRange === '80-100' && (score < 80)) return false;
      if (filters.scoreRange === '60-80' && (score < 60 || score >= 80)) return false;
      if (filters.scoreRange === '40-60' && (score < 40 || score >= 60)) return false;
      if (filters.scoreRange === '0-40' && (score >= 40)) return false;
    }
    
    // Confidence
    if (filters.confidence !== 'all' && l.current_confidence?.toLowerCase() !== filters.confidence.toLowerCase()) return false;
    
    // CRM Status
    if (filters.crmStatus !== 'all' && l.assignment_status?.toLowerCase() !== filters.crmStatus.toLowerCase()) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-primary" /> {activeProduct.name} Leads</h1>
          <p className="text-muted-foreground">Manage premium Opportunity Intelligence leads for {activeProduct.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
          <Button className="gap-2 bg-primary"><Users className="h-4 w-4" /> Import Leads</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Leads ({leads.length})</TabsTrigger>
                <TabsTrigger value="uncontacted">Uncontacted ({leads.filter(l => !l.is_contacted).length})</TabsTrigger>
                <TabsTrigger value="active">Active in CRM ({leads.filter(l => l.is_contacted).length})</TabsTrigger>
              </TabsList>
              
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by company or email..." 
                      className="pl-9 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 gap-2"><Filter className="h-4 w-4" /> Filter</Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Filter Leads</SheetTitle>
                        <SheetDescription>Apply advanced filters to your lead database.</SheetDescription>
                      </SheetHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Score Range</Label>
                          <Select value={filters.scoreRange} onValueChange={(v) => setFilters({...filters, scoreRange: v})}>
                            <SelectTrigger><SelectValue placeholder="All Scores" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Scores</SelectItem>
                              <SelectItem value="80-100">80 - 100 (Top Tier)</SelectItem>
                              <SelectItem value="60-80">60 - 80 (Good Fit)</SelectItem>
                              <SelectItem value="40-60">40 - 60 (Moderate)</SelectItem>
                              <SelectItem value="0-40">0 - 40 (Low Fit)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Confidence</Label>
                          <Select value={filters.confidence} onValueChange={(v) => setFilters({...filters, confidence: v})}>
                            <SelectTrigger><SelectValue placeholder="All Levels" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="high">High Confidence</SelectItem>
                              <SelectItem value="medium">Medium Confidence</SelectItem>
                              <SelectItem value="low">Low Confidence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>CRM Status</Label>
                          <Select value={filters.crmStatus} onValueChange={(v) => setFilters({...filters, crmStatus: v})}>
                            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="base scored">Base Scored</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="meeting booked">Meeting Booked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input placeholder="e.g. United States" value={filters.country} onChange={(e) => setFilters({...filters, country: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input placeholder="e.g. New York" value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Source</Label>
                          <Input placeholder="e.g. Google Maps" value={filters.source} onChange={(e) => setFilters({...filters, source: e.target.value})} />
                        </div>
                        <div className="pt-4 flex gap-2">
                          <Button variant="outline" className="w-full" onClick={() => setFilters({country: "", city: "", category: "", source: "", scoreRange: "all", confidence: "all", crmStatus: "all"})}>
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold">Company</th>
                  <th className="px-6 py-3 font-semibold">Location</th>
                  <th className="px-6 py-3 font-semibold">Base Score</th>
                  <th className="px-6 py-3 font-semibold">Confidence</th>
                  <th className="px-6 py-3 font-semibold">CRM Stage</th>
                  <th className="px-6 py-3 font-semibold">Last Updated</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading leads...</td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No leads available.</td></tr>
                ) : (
                  filteredLeads.map((lead, i) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {lead.company_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Source: {lead.source || 'Import'}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground flex items-center gap-1 mt-2"><MapPin className="h-3 w-3" /> {lead.city ? `${lead.city}, ` : ''}{lead.country || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {lead.current_score || (lead.metadata?.oie_score?.lead_score) || (lead.metadata?.oie_score?.opp_score) || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={lead.current_confidence === 'High' ? 'default' : 'secondary'} className={lead.current_confidence === 'High' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                          {lead.current_confidence || (lead.metadata?.oie_score?.conf_score ? (lead.metadata.oie_score.conf_score > 0.7 ? 'High' : (lead.metadata.oie_score.conf_score > 0.4 ? 'Medium' : 'Low')) : 'Low')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={!lead.is_contacted ? 'secondary' : 'default'} className={!lead.is_contacted ? '' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}>
                          {lead.assignment_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : 'Just now'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/lead/${lead.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 gap-1">View Profile <ArrowRight className="h-3 w-3" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
            <span>Showing {filteredLeads.length} entries</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceMyLeads;
