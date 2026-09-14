import { useState, useEffect } from "react";
import validationLeads from "@/data/validation_leads.json";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Building2, MapPin, Globe, Phone, Mail, Star, Users, BookmarkPlus, Zap, MessageSquare, Copy, Link as LinkIcon, Info, ExternalLink, Send, CheckCircle2, XCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OutreachGeneratorModal } from "@/components/OutreachGeneratorModal";
import Navigation from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth() as any;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [outreachOpen, setOutreachOpen] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    if (!id) return;
    try {
      const staticLead = (validationLeads as any[]).find(l => l.id === id);
      if (staticLead) {
        setLead({
            id: staticLead.id,
            company_name: staticLead.company,
            description: staticLead.reason,
            industry: 'Technology',
            city: staticLead.city,
            country: 'India',
            contact_email: 'hello@' + staticLead.company.lower().replace(/[^a-z0-9]/g, '') + '.com',
            score: staticLead.quality,
            opportunity_quality: staticLead.quality,
            evidence_confidence: staticLead.conf_value,
            commercial_value: staticLead.ev,
            lcb: staticLead.lcb,
            status: staticLead.status,
            source: staticLead.type,
            signals: staticLead.signal,
            rank: staticLead.rank
        });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) throw error;
      setLead(data);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load lead details.', variant: 'destructive' });
      navigate('/workspace/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const { data: existingOpp, isLoading: loadingOpp, refetch: refetchOpp } = useQuery({
    queryKey: ['lead-in-crm', id, profile?.id],
    queryFn: async () => {
      if (!id || !profile?.id) return null;
      const { data, error } = await supabase
        .from('assigned_leads')
        .select('*')
        .eq('lead_id', id)
        .eq('client_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!profile?.id
  });

  const { data: leadScoreData } = useQuery({
    queryKey: ['lead-score-history', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('lead_score_history')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Hardcode module progress for base scoring phase
  const REQUIRED_MODULES = [
    { type: 'google_maps', name: 'Google Maps Data', status: 'Completed' },
    { type: 'website', name: 'Website Research', status: 'Pending' },
    { type: 'linkedin', name: 'LinkedIn Intelligence', status: 'Pending' },
    { type: 'verification', name: 'Identity Verification', status: 'Pending' },
    { type: 'decision_makers', name: 'Decision Maker Graph', status: 'Pending' },
    { type: 'export_intelligence', name: 'Export Intelligence', status: 'Pending' }
  ];


  const completedModulesCount = REQUIRED_MODULES.filter(m => m.status === 'Completed').length;
  const researchCompleteness = Math.round((completedModulesCount / REQUIRED_MODULES.length) * 100);
  const nextBestResearch = REQUIRED_MODULES.find(m => m.status === 'Pending')?.name || null;

  const handleBookmark = async () => {
    if (!user) return toast({ title: 'Auth Required', description: 'Please sign in to bookmark.' });
    try {
      const { error } = await supabase.from('saved_leads').insert({
        user_id: user.id,
        lead_id: lead.id
      });
      if (error) {
        if (error.code === '23505') throw new Error('Lead is already bookmarked');
        throw error;
      }
      toast({ title: 'Bookmarked', description: 'Lead saved to your bookmarks.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleViewInCRM = async () => {
    if (!user?.id || !id) return;
    try {
      // Check if already in CRM (assigned_leads)
      const { data: existing } = await supabase
        .from('assigned_leads')
        .select('id')
        .eq('lead_id', id)
        .eq('client_id', user.id)
        .maybeSingle();

      if (!existing) {
        // Auto-create on the fly
        await supabase
          .from('assigned_leads')
          .insert({
            lead_id: id,
            client_id: user.id,
            status: 'New',
            is_contacted: false
          });
      }
      navigate('/workspace/crm');
    } catch (err) {
      console.error("Error auto-creating CRM entry:", err);
      navigate('/workspace/crm');
    }
  };

  const handleUpdateStage = async (newStage: string) => {
    if (!existingOpp) return;
    try {
      const { error } = await supabase
        .from('assigned_leads')
        .update({ lifecycle_stage: newStage })
        .eq('id', existingOpp.id);
        
      if (error) throw error;
      toast({ title: 'Stage Updated', description: `Lead moved to ${newStage}` });
      refetchOpp();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${fieldName} copied to clipboard.` });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Lead...</div>;
  if (!lead) return <div className="min-h-screen bg-background flex items-center justify-center">Lead not found.</div>;

  // --- Aggressive Metadata Extraction (Data Preservation) ---
  const meta = lead.metadata || {};

  // Company Information (Reading natively from Master Schema before fallback)
  const companyName = lead.name || meta.company_name || meta.business_name || lead.company_name || lead.title || meta.title || 'Unknown Company';
  const description = lead.description || meta.description || meta.about || '';
  const businessSummary = meta.business_summary || meta.summary || '';
  const category = lead.main_category || meta.category || meta.business_category || lead.category || '';
  const subcategory = meta.subcategory || meta.sub_category || lead.sub_niche || meta.sub_niche || '';
  const businessType = meta.business_type || lead.project_type || meta.project_type || lead.business_type || '';
  const industry = lead.industry || meta.industry || '';

  // Helper to safely extract string from possible array
  const extractString = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val.length > 0 ? String(val[0]) : '';
    return String(val);
  };

  // Regex fallback for embedded emails
  const extractEmailFromText = (text: string): string => {
    if (!text) return '';
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0].toLowerCase() : '';
  };

  // Contact Information
  const phone = lead.phone || extractString(meta.phone || meta.phones || meta.mobile || meta.contact_number || meta.telephone || meta['Phone Number'] || meta['phone number'] || meta.phoneNumber || meta.phone_number);
  const additionalPhones = extractString(meta.additional_phones || meta.other_phones || meta.fax);
  
  // Attempt to extract email from standard columns
  let email = extractString(meta.email || meta.emails || meta.email_address || meta.contact_email || lead.email);
  // Fallback to regex extraction from description/summary if the dataset failed to parse it into a column
  if (!email) {
    email = extractEmailFromText(description) || extractEmailFromText(businessSummary);
  }
  
  const website = lead.website || extractString(meta.website || meta.websites || meta.url || meta.domain);
  
  // Social Profiles
  const socialLinkedIn = meta.linkedin || lead.linkedin_url || '';
  const socialFacebook = meta.facebook || '';
  const socialInstagram = meta.instagram || '';

  // Location
  const address = lead.address || meta.address || meta.full_address || lead.location || meta.location || '';
  const city = meta.city || '';
  const state = meta.state || meta.region || meta.province || '';
  const country = meta.country || '';
  const postalCode = meta.postal_code || meta.zip || meta.zipcode || meta.zip_code || '';
  const latitude = meta.latitude || meta.lat || '';
  const longitude = meta.longitude || meta.lng || meta.lon || '';

  // Ownership & Decision Makers
  const owner = lead.owner_name || meta.owner_name || meta.owner || '';
  const founder = meta.founder_name || meta.founder || '';
  const director = meta.director || meta.managing_director || meta.md || '';
  const primaryContact = meta.contact_person || meta.primary_contact || lead.contact_name || '';

  // Trust Signals
  const rating = lead.rating || meta.rating || meta.google_rating || '';
  const reviewCount = lead.reviews || meta.review_count || meta.reviews || meta.total_reviews || '';
  const googleMapsUrl = lead.link || meta.google_maps_url || meta.maps_url || meta.google_maps_link || meta.map_url || '';
  const reviewUrl = meta.review_url || meta.reviews_link || '';
  const qualityScore = lead.quality_score || lead.current_score || meta.quality_score || '';
  const source = lead.source_type || meta.source || 'Imported';


  // Financial & Corporate
  const revenue = meta.revenue || meta.annual_revenue || meta.estimated_revenue || '';
  const employees = meta.employees || meta.employee_count || meta.company_size || '';
  const founded = meta.founded || meta.year_founded || meta.founded_year || '';
  const certifications = meta.certifications || meta.iso_certifications || '';
  const brands = meta.brands || meta.product_brands || '';
  
  // Additional Information
  const openingHours = lead.workday_timing || meta.opening_hours || meta.hours || '';
  const businessStatus = lead.is_temporarily_closed ? 'Temporarily Closed' : (meta.business_status || meta.status || '');

  // Generate a list of fields already displayed so we can filter them out of the raw metadata block
  const usedKeys = [
    'company_name', 'business_name', 'title', 'description', 'about', 'summary', 'business_summary', 
    'category', 'business_category', 'subcategory', 'sub_category', 'sub_niche', 'business_type', 'project_type', 'industry',
    'phone', 'phones', 'mobile', 'contact_number', 'telephone', 'additional_phones', 'other_phones', 'fax',
    'email', 'emails', 'email_address', 'contact_email', 'website', 'websites', 'url', 'domain',
    'address', 'full_address', 'location', 'city', 'state', 'region', 'province', 'country',
    'postal_code', 'zip', 'zipcode', 'zip_code', 'latitude', 'lat', 'longitude', 'lng', 'lon',
    'owner_name', 'owner', 'founder_name', 'founder', 'director', 'managing_director', 'md',
    'contact_person', 'primary_contact', 'contact_name',
    'rating', 'google_rating', 'review_count', 'reviews', 'total_reviews',
    'google_maps_url', 'maps_url', 'google_maps_link', 'map_url', 'review_url', 'reviews_link',
    'quality_score', 'source', 'source_type', 'source_file', 'source_upload_id',
    'opening_hours', 'hours', 'business_status', 'status', 'linkedin', 'facebook', 'instagram',
    'oie_score', '_temp_oie_score', 'revenue', 'annual_revenue', 'estimated_revenue', 'employees', 'employee_count', 'company_size', 'founded', 'year_founded', 'founded_year', 'certifications', 'iso_certifications', 'brands', 'product_brands'
  ];

  const rawMetadataKeys = Object.keys(meta).filter(k => !usedKeys.includes(k) && meta[k] !== null && meta[k] !== '');

  // Helper for formatting URLs
  const formatUrl = (url: string) => (url.startsWith('http') ? url : `https://${url}`);
  
  // WhatsApp Link Helper
  const getWhatsAppLink = (phoneString: string) => {
    if (!phoneString) return null;
    
    // Check if the phone starts with a + (international format)
    const hasPlus = phoneString.trim().startsWith('+');
    
    // Strip all non-numeric characters
    let cleaned = phoneString.replace(/\D/g, '');
    
    if (!cleaned) return null;
    
    // If it had a +, prepend it back for the API to parse the country code correctly
    // or just leave it stripped since api.whatsapp.com usually handles pure numbers well.
    // However, WhatsApp recommends omitting the + entirely. 
    // We will use api.whatsapp.com/send?phone= as it is more robust on desktop.
    return `https://api.whatsapp.com/send?phone=${cleaned}`;
  };

  const openWhatsApp = (phoneStr: string) => {
    const link = getWhatsAppLink(phoneStr);
    if (!link) {
      toast({ title: 'Invalid Phone', description: 'Could not generate a valid WhatsApp link for this number.', variant: 'destructive' });
      return;
    }
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-6xl py-8 mt-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAIN COLUMN */}
          <div className="md:col-span-2 space-y-6">

            
            {/* OPPORTUNITY INTELLIGENCE JOEP SCORING CARD */}
            {lead.lcb !== undefined && (
              <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-white to-slate-50">
                <CardHeader className="border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center text-primary">
                        <Zap className="w-5 h-5 mr-2" />
                        JAS Opportunity Intelligence
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rank #{lead.rank} — {lead.status}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono bg-primary/5">
                      LCB = EV · (1 − κ(1 − Conf))
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Metric Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-xs font-semibold text-emerald-800 uppercase mb-1">Final LCB</p>
                      <p className="text-2xl font-bold text-emerald-900">${(lead.lcb || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
                      <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Expected Value</p>
                      <p className="text-2xl font-bold text-blue-900">${(lead.commercial_value || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-center">
                      <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-amber-900">{(lead.evidence_confidence || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-semibold text-slate-800 uppercase mb-1">Opportunity Quality</p>
                      <p className="text-2xl font-bold text-slate-900">{lead.opportunity_quality || 0}/100</p>
                    </div>
                  </div>

                  {/* Why JAS Prioritized This Lead */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3 tracking-wider">Why JAS Prioritized This Lead</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Strong Signal Detection</p>
                          <p className="text-sm text-slate-600">{lead.signals || 'High growth potential detected.'}</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Business Rationale</p>
                          <p className="text-sm text-slate-600">{lead.description || 'Strong ICP fit for Jumbl products.'}</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* What We Don't Know */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3 tracking-wider">What We Don't Know</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <XCircle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Exact Procurement Timeline</p>
                          <p className="text-sm text-slate-600">Requires direct outreach to confirm current buying cycle.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-5 h-5 text-primary" />
                      <p className="font-semibold text-primary">Recommended Action</p>
                    </div>
                    <p className="text-sm text-foreground/80 ml-7">
                      Import to CRM and {lead.status === 'CONTACT NOW' ? 'initiate outreach immediately targeting BD/Ops leadership.' : 'monitor for additional signals.'}
                    </p>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* LEGACY OIE Score Parsing Section */}
            
            {meta.oie_score && typeof meta.oie_score === 'object' && (
              <Card className="shadow-sm border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                <CardHeader className="bg-indigo-500/10 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-400">
                    <Activity className="w-5 h-5" />
                    Opportunity Intelligence Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background rounded-lg p-3 border border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1">Overall Score</span>
                      <span className="text-2xl font-bold text-indigo-400">{meta.oie_score.lead_score || meta.oie_score.opp_score || 0}</span>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1">Confidence</span>
                      <span className="text-2xl font-bold">{meta.oie_score.conf_score ? Math.round(meta.oie_score.conf_score * 100) : 0}%</span>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1">ICP Tier</span>
                      <span className="text-2xl font-bold text-amber-400">{meta.oie_score.icp_tier || 'N/A'}</span>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1">Bucket</span>
                      <span className="text-2xl font-bold">{meta.oie_score.opp_bucket || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Engine Reasoning</h4>
                      <p className="text-sm text-slate-300 bg-black/20 p-3 rounded-md border border-white/5">
                        {meta.oie_score.explanation || 'No reasoning provided.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t border-white/10 pt-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Fit Score</span>
                        <span className="font-medium">{meta.oie_score.fit_score || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Intent Score</span>
                        <span className="font-medium">{meta.oie_score.intent_score || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Trust Score</span>
                        <span className="font-medium">{meta.oie_score.trust_score || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Risk Score</span>
                        <span className="font-medium">{meta.oie_score.risk_score || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Header / Main Identity */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl mb-2">{companyName}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                      {industry && <Badge variant="secondary">{industry}</Badge>}
                      {category && <Badge variant="outline">{category}</Badge>}
                      {subcategory && <Badge variant="outline">{subcategory}</Badge>}
                      {businessType && <Badge variant="outline">{businessType}</Badge>}
                      
                      {/* Trust Signals in Header */}
                      {(rating || reviewCount) && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                          <Star className="w-3 h-3 mr-1 fill-amber-500" /> {rating || 'No Rating'} {reviewCount ? `(${reviewCount} Reviews)` : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-slate-500/10 text-slate-500 text-sm py-1 px-3">
                      Original Score: {lead.metadata?.oie_score?.base_score || lead.current_score || 0}
                    </Badge>
                    <Badge className="bg-purple-500/10 text-purple-500 text-sm py-1 px-3 mt-1">
                      Confidence: {lead.current_confidence || 'Medium'}
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-500 text-sm py-1 px-3 font-bold mt-1">
                      Weighted Avg: {lead.current_score || 0}
                    </Badge>
                    {existingOpp && (
                      <div className="flex flex-col gap-2 items-end mt-2">
                        <Badge className="bg-blue-500/10 text-blue-500 text-sm py-1 px-3 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> In CRM
                        </Badge>
                        {existingOpp.opportunity_priorities?.[0]?.priority_level && (
                          <Badge className={`${
                            existingOpp.opportunity_priorities[0].priority_level === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                            existingOpp.opportunity_priorities[0].priority_level === 'HOT' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {existingOpp.opportunity_priorities[0].priority_level} PRIORITY
                          </Badge>
                        )}
                        {existingOpp.opportunity_health?.[0]?.health_status && (
                          <Badge className={`${
                            existingOpp.opportunity_health[0].health_status === 'Healthy' || existingOpp.opportunity_health[0].health_status === 'Growing' ? 'bg-emerald-500/10 text-emerald-500' :
                            existingOpp.opportunity_health[0].health_status === 'At Risk' || existingOpp.opportunity_health[0].health_status === 'Cooling' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            Health: {existingOpp.opportunity_health[0].health_status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* About Company */}
              {(description || businessSummary) && (
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary" /> About Company
                  </h3>
                  {description && <p className="text-muted-foreground whitespace-pre-wrap mb-4">{description}</p>}
                  {businessSummary && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">Business Summary</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{businessSummary}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* ACTION PLAN & CRM TIMELINE (Phase 10) */}
            {existingOpp && (
              <Card className="border-blue-500/20 shadow-md">
                <CardHeader className="bg-blue-500/5">
                  <CardTitle className="text-xl flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-500" /> Lead Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">CRM Stage</span>
                      <Select 
                        value={existingOpp.lifecycle_stage || 'New'} 
                        onValueChange={handleUpdateStage}
                      >
                        <SelectTrigger className="h-8 border-primary/20 bg-background">
                          <SelectValue placeholder="Select Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Meeting Booked">Meeting Booked</SelectItem>
                          <SelectItem value="Quotation Sent">Quotation Sent</SelectItem>
                          <SelectItem value="Negotiation">Negotiation</SelectItem>
                          <SelectItem value="Won">Won</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Status</span>
                      <span className="font-semibold text-foreground capitalize">{existingOpp.lifecycle_stage === 'Won' || existingOpp.lifecycle_stage === 'Lost' ? 'Closed' : 'Active'}</span>
                    </div>
                  </div>

                  {existingOpp.activities && existingOpp.activities.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-sm font-semibold mb-4 text-muted-foreground">CRM Timeline</h4>
                      <div className="space-y-4">
                        {existingOpp.activities.slice(0, 5).map((activity: any) => (
                          <div key={activity.id} className="flex gap-4">
                            <div className="mt-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.title}</p>
                              {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(activity.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            
            {/* Corporate Profile */}
            {(revenue || employees || founded || certifications || brands) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary" /> Corporate Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    {founded && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Founded</span>
                        <span className="font-medium">{founded}</span>
                      </div>
                    )}
                    {employees && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Employees</span>
                        <span className="font-medium">{employees}</span>
                      </div>
                    )}
                    {revenue && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Annual Revenue</span>
                        <span className="font-medium">{revenue}</span>
                      </div>
                    )}
                    {certifications && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Certifications</span>
                        <span className="font-medium">{certifications}</span>
                      </div>
                    )}
                    {brands && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Associated Brands</span>
                        <span className="font-medium">{brands}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary" /> Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                  {address && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Full Address</span>
                      <span className="font-medium">{address}</span>
                    </div>
                  )}
                  {city && (
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">City</span>
                      <span className="font-medium">{city}</span>
                    </div>
                  )}
                  {state && (
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">State / Province</span>
                      <span className="font-medium">{state}</span>
                    </div>
                  )}
                  {postalCode && (
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Postal Code</span>
                      <span className="font-medium">{postalCode}</span>
                    </div>
                  )}
                  {country && (
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Country</span>
                      <span className="font-medium">{country}</span>
                    </div>
                  )}
                  {(latitude || longitude) && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Coordinates</span>
                      <span className="font-medium">{latitude && `Lat: ${latitude}`} {longitude && `Lng: ${longitude}`}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ownership & Decision Makers */}
            {(owner || founder || director || primaryContact) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" /> Ownership & Decision Makers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    {owner && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Owner</span>
                        <span className="font-medium">{owner}</span>
                      </div>
                    )}
                    {founder && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Founder</span>
                        <span className="font-medium">{founder}</span>
                      </div>
                    )}
                    {director && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Director</span>
                        <span className="font-medium">{director}</span>
                      </div>
                    )}
                    {primaryContact && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Primary Contact</span>
                        <span className="font-medium">{primaryContact}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information (Fallback raw metadata) */}
            {(openingHours || businessStatus || rawMetadataKeys.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Info className="w-5 h-5 mr-2 text-primary" /> Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(openingHours || businessStatus) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg mb-4">
                        {openingHours && (
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Opening Hours</span>
                            <span className="font-medium whitespace-pre-wrap">{openingHours}</span>
                          </div>
                        )}
                        {businessStatus && (
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Business Status</span>
                            <span className="font-medium">{businessStatus}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {rawMetadataKeys.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Source Dataset Attributes</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {rawMetadataKeys.map(key => (
                            <div key={key} className="bg-muted/20 p-2 rounded border border-white/5">
                              <span className="text-xs text-muted-foreground block mb-1 font-mono">{key}</span>
                              <span className="font-medium break-words">
                                {typeof meta[key] === 'object' ? JSON.stringify(meta[key]) : String(meta[key])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* SIDEBAR COLUMN */}
          <div className="space-y-6">
            
            {/* Module Registry & Completeness */}
            <Card className="border-purple-500/20 shadow-md">
              <CardHeader className="bg-purple-500/5 pb-4">
                <CardTitle className="text-xl flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-500" /> Research Registry
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-muted-foreground">Completeness</span>
                    <span className="text-lg font-bold text-foreground">{completedModulesCount} / {REQUIRED_MODULES.length} Modules ({researchCompleteness}%)</span>
                  </div>
                  <Progress value={researchCompleteness} className="h-2 [&>div]:bg-purple-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {REQUIRED_MODULES.map(mod => {
                    const isCompleted = mod.status === 'Completed';
                    


  return (
                      <div key={mod.type} className={`flex items-center p-2 rounded text-xs ${isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 mr-2 shrink-0" /> : <XCircle className="w-3.5 h-3.5 mr-2 shrink-0" />}
                        <span className="truncate">{mod.name}</span>
                      </div>
                    );
                  })}
                </div>

                {nextBestResearch && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">Next Recommended Research</span>
                    <span className="text-sm font-medium text-amber-100">Research {nextBestResearch}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* OIE Score Breakdown */}
            {leadScoreData && leadScoreData.score_breakdown && (
              <Card className="border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Star className="w-24 h-24" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Star className="w-5 h-5 mr-2 text-primary" /> OIE Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-4xl font-bold text-primary">{leadScoreData.overall_score || lead.current_score || 0}</span>
                    <span className="text-sm text-muted-foreground pb-1">Final Score</span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: "Procurement (PROC)", value: leadScoreData.score_breakdown.proc?.score, color: "bg-blue-500" },
                      { label: "Contactability (CONT)", value: leadScoreData.score_breakdown.cont?.score, color: "bg-indigo-500" },
                      { label: "Confidence (CONF)", value: leadScoreData.score_breakdown.conf?.score, color: "bg-purple-500" },
                      { label: "Fit / Target (FIT)", value: leadScoreData.score_breakdown.fit?.score, color: "bg-emerald-500" }
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{metric.label}</span>
                          <span className="text-muted-foreground">{Math.round((metric.value || 0) * 100)}%</span>
                        </div>
                        <Progress value={(metric.value || 0) * 100} className={`h-1.5 [&>div]:${metric.color}`} />
                      </div>
                    ))}
                  </div>

                  {leadScoreData.reason_codes && leadScoreData.reason_codes.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Analysis Evidence</h4>
                      <ul className="text-xs space-y-1.5 text-muted-foreground">
                        {leadScoreData.reason_codes.map((bullet: string, i: number) => (
                          <li key={i} className="leading-snug flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Outreach Center (Action Buttons) */}
            <Card className="border-blue-500/30 shadow-lg shadow-blue-500/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" /> Outreach Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all h-12 text-base font-semibold" onClick={() => setOutreachOpen(true)}>
                  <Zap className="w-4 h-4 mr-2" /> Generate AI Outreach
                </Button>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {phone && (
                    <Button variant="outline" className="w-full bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-500" onClick={() => openWhatsApp(phone)}>
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  )}
                  {email && (
                    <Button variant="outline" className="w-full bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-500" onClick={() => window.location.href = `mailto:${email}`}>
                      <Send className="w-4 h-4 mr-2" /> Email
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={handleViewInCRM}>
                    <Users className="w-4 h-4 mr-2" /> View in CRM
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleBookmark}>
                    <BookmarkPlus className="w-4 h-4 mr-2" /> Save Lead
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone Fields */}
                {phone && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center overflow-hidden mr-2">
                      <Phone className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs text-muted-foreground">Primary Phone</p>
                        <p className="font-medium truncate">{phone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(phone, 'Phone')}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                {additionalPhones && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center overflow-hidden mr-2">
                      <Phone className="w-5 h-5 mr-3 text-muted-foreground flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs text-muted-foreground">Additional Phone</p>
                        <p className="font-medium truncate">{additionalPhones}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(additionalPhones, 'Additional Phone')}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                
                {/* Email Field */}
                {email && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center overflow-hidden mr-2">
                      <Mail className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(email, 'Email')}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                
                {/* Website Field */}
                {website && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center overflow-hidden mr-2">
                      <Globe className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs text-muted-foreground">Website</p>
                        <a href={formatUrl(website)} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:underline truncate block">
                          {website}
                        </a>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(website, 'Website')}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                {/* Social Links */}
                {(socialLinkedIn || socialFacebook || socialInstagram) && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Social Links</p>
                    <div className="flex flex-col gap-2">
                      {socialLinkedIn && (
                        <a href={formatUrl(socialLinkedIn)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline p-2 bg-muted/30 rounded">
                          <LinkIcon className="w-4 h-4 mr-2" /> LinkedIn Profile
                        </a>
                      )}
                      {socialFacebook && (
                        <a href={formatUrl(socialFacebook)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline p-2 bg-muted/30 rounded">
                          <LinkIcon className="w-4 h-4 mr-2" /> Facebook Profile
                        </a>
                      )}
                      {socialInstagram && (
                        <a href={formatUrl(socialInstagram)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline p-2 bg-muted/30 rounded">
                          <LinkIcon className="w-4 h-4 mr-2" /> Instagram Profile
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback Empty State */}
                {!phone && !additionalPhones && !email && !website && !socialLinkedIn && !socialFacebook && !socialInstagram && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No contact info available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust Signals & Source */}
            {(rating || reviewCount || googleMapsUrl || reviewUrl || source) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Trust Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(rating || reviewCount) && (
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-500">{rating || 'N/A'}</span>
                      </div>
                      <p className="text-sm text-amber-500/80">{reviewCount ? `${reviewCount} Reviews` : 'No Review Count'}</p>
                    </div>
                  )}
                  
                  {(googleMapsUrl || reviewUrl) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">External Links</h4>
                      {googleMapsUrl && (
                        <a href={formatUrl(googleMapsUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline">
                          <ExternalLink className="w-4 h-4 mr-2" /> Open Google Maps
                        </a>
                      )}
                      {reviewUrl && (
                        <a href={formatUrl(reviewUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline">
                          <ExternalLink className="w-4 h-4 mr-2" /> Read Reviews
                        </a>
                      )}
                    </div>
                  )}
                  
                  {source && (
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Lead Source</span>
                      <Badge variant="secondary">{source}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>

      {/* Outreach Generator Modal */}
      {outreachOpen && lead && (
        <OutreachGeneratorModal 
          isOpen={outreachOpen}
          onClose={() => setOutreachOpen(false)}
          lead={lead}
          userProfile={user || {}}
        />
      )}
    </div>
  );
}
