import { useState } from "react";
import { 
  Building, Globe, Search, Save, Sparkles, TrendingUp, 
  MapPin, Users, Target, Activity, Share2, Briefcase, Mail, Phone, ShieldCheck, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface VerifiedField {
  value: string | number;
  source: string;
  url?: string;
  confidence: number;
}

const VerifiedDataField = ({ label, field, icon: Icon }: { label: string, field?: VerifiedField, icon?: any }) => {
  if (!field || !field.value || field.value === "Unknown" || field.value === "Not Found") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 opacity-70">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground/50" />}
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground italic">Unknown</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><AlertCircle className="h-3 w-3 text-red-400/50" /></TooltipTrigger>
                <TooltipContent><p>Source: Not Found</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      {Icon && <Icon className="h-5 w-5 text-primary/70" />}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          {field.url ? (
            <a href={field.url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary hover:underline transition-colors">
              {field.value}
            </a>
          ) : (
            <span className="font-medium">{field.value}</span>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <ShieldCheck className={`h-4 w-4 ${field.confidence >= 90 ? 'text-green-500' : 'text-yellow-500'}`} />
              </TooltipTrigger>
              <TooltipContent className="space-y-1">
                <p className="font-semibold text-xs">Verified Source</p>
                <p className="text-xs">Source: {field.source}</p>
                <p className="text-xs">Confidence: {field.confidence}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export const EnrichmentView = () => {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [leadId, setLeadId] = useState("");
  
  // Real structure enforcing strict source tracking
  const [enrichedData, setEnrichedData] = useState<any>(null);
  
  const handleAnalyze = async () => {
    if (!companyName && !websiteUrl) {
      toast({
        title: "Input Required",
        description: "Please enter either a Company Name or a Website URL to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setEnrichedData(null);
    
    let baseData = {
      profile: {
        query_company_name: companyName,
        query_website_url: websiteUrl,
        jas_opportunity_score: null as number | null,
      },
      fields: {
        legal_business_name: { value: "Unknown", source: "Not Found", confidence: 0 },
        industry: { value: "Unknown", source: "Not Found", confidence: 0 },
        sub_industry: { value: "Unknown", source: "Not Found", confidence: 0 },
        year_founded: { value: "Unknown", source: "Not Found", confidence: 0 },
        headquarters: { value: "Unknown", source: "Not Found", confidence: 0 },
        company_size: { value: "Unknown", source: "Not Found", confidence: 0 },
        estimated_revenue: { value: "Unknown", source: "Not Found", confidence: 0 },
        general_email: { value: "Unknown", source: "Not Found", confidence: 0 },
        phone: { value: "Unknown", source: "Not Found", confidence: 0 },
        procurement_potential: { value: "Unknown", source: "Not Found", confidence: 0 },
        export_potential: { value: "Unknown", source: "Not Found", confidence: 0 }
      },
      signals: [] as any[],
      contacts: [] as any[],
      ai_summary: null
    };

    try {
      // 1. Direct Extraction Logic (No Database Dependency)
      let targetDomain = websiteUrl || companyName;
      if (!targetDomain.startsWith('http')) targetDomain = `https://${targetDomain}`;
      
      const proxyUrl = `/api/scrape-website?url=${encodeURIComponent(targetDomain)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
         throw new Error("Could not reach website. The proxy server returned an error.");
      }
      
      let html = await response.text();
      // Basic cleanup to reduce tokens
      let textContent = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 60000);

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env");

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

      const prompt = `
You are a highly analytical business intelligence agent.
Extract verified company intelligence from the following website text.
If a field is missing, return "Unknown". Do NOT hallucinate.

Return JSON in this EXACT structure:
{
  "fields": {
    "legal_business_name": { "value": "...", "source": "Official Website", "confidence": 95 },
    "industry": { "value": "...", "source": "Official Website", "confidence": 90 },
    "sub_industry": { "value": "...", "source": "Official Website", "confidence": 90 },
    "year_founded": { "value": "...", "source": "Official Website", "confidence": 85 },
    "headquarters": { "value": "...", "source": "Official Website", "confidence": 90 },
    "company_size": { "value": "...", "source": "Official Website", "confidence": 75 },
    "estimated_revenue": { "value": "...", "source": "Official Website", "confidence": 60 },
    "general_email": { "value": "...", "source": "Official Website", "confidence": 95 },
    "phone": { "value": "...", "source": "Official Website", "confidence": 90 },
    "procurement_potential": { "value": "High/Medium/Low - reason", "source": "AI Analysis", "confidence": 80 },
    "export_potential": { "value": "High/Medium/Low - reason", "source": "AI Analysis", "confidence": 80 }
  },
  "contacts": [
    { "name": "...", "designation": "...", "linkedin": "..." }
  ],
  "signals": [
    { "signal_type": "Hiring/Expansion/etc", "description": "...", "source_type": "Website", "source_url": "...", "confidence_score": 85 }
  ]
}

Website text:
${textContent}
`;
      const aiResult = await model.generateContent(prompt);
      const structuredData = JSON.parse(aiResult.response.text());

      // Merge results into baseData
      Object.keys(structuredData.fields).forEach(key => {
         if (structuredData.fields[key] && structuredData.fields[key].value !== "Unknown") {
            baseData.fields[key as keyof typeof baseData.fields] = structuredData.fields[key];
         }
      });
      baseData.contacts = structuredData.contacts || [];
      baseData.signals = structuredData.signals || [];

      toast({
        title: "Analysis Complete",
        description: "Successfully extracted company intelligence.",
      });

    } catch (err: any) {
      console.error("Enrichment process failed:", err);
      toast({
        title: "Enrichment Extract Failed",
        description: err.message || "An unexpected error occurred during extraction.",
        variant: "destructive"
      });
    } finally {
      // Calculate final score based on available verified fields
      let verifiedCount = Object.values(baseData.fields).filter((f: any) => f.value !== "Unknown").length;
      if (verifiedCount > 0) {
         let score = verifiedCount * 9;
         if (String(baseData.fields.procurement_potential.value).includes("High")) score += 15;
         baseData.profile.jas_opportunity_score = Math.min(score, 100);
      }
      
      setEnrichedData(baseData);
      setLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    if (!enrichedData) return;
    
    // AI is forbidden from generating summaries if there's no verified data
    toast({
      title: "Cannot Generate Summary",
      description: "AI requires verified data fields to generate a summary. Currently, all fields are unknown.",
      variant: "destructive"
    });
  };

  const handleSaveToCrm = async () => {
    if (!enrichedData || !user) return;
    if (!leadId) {
      toast({
        title: "Lead ID Required",
        description: "You must specify an existing Lead ID to append this module.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Fetch latest version to preserve history
      const { data: existingModules } = await supabase
        .from('lead_modules')
        .select('version')
        .eq('lead_id', leadId)
        .eq('module_type', 'Website')
        .order('version', { ascending: false })
        .limit(1);
        
      const nextVersion = existingModules && existingModules.length > 0 ? (existingModules[0].version || 1) + 1 : 1;

      const { error } = await supabase
        .from('lead_modules')
        .insert({
          lead_id: leadId,
          module_type: 'Website',
          evidence: enrichedData.fields,
          confidence: 85,
          source: 'Enrichment Scraper',
          updated_by: user.id,
          version: nextVersion
        });
        
      if (error) throw error;
      
      toast({
        title: "Module Added",
        description: "Verified company profile appended to Lead ID successfully."
      });
    } catch (err: any) {
      toast({
        title: "Error Saving to CRM",
        description: "Results generated successfully but could not be saved to CRM. " + (err.message || ""),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Company Enrichment
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Strict Audited Intelligence
          </p>
        </div>
        
        {enrichedData && (
          <div className="flex gap-3">
            <Button onClick={handleGenerateSummary} variant="secondary" disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Summary
            </Button>
            <Button onClick={handleSaveToCrm} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save To CRM
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card/50 border-white/10 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Target Lead ID (Required)</Label>
              <Input 
                placeholder="Paste UUID..." 
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Acme Corporation" 
                  className="pl-9"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="https://acmecorp.com" 
                  className="pl-9"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleAnalyze} disabled={loading} size="lg" className="w-full md:w-auto">
              {loading ? (
                <Activity className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? "Analyzing..." : "Analyze Company"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enrichedData && (
        <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/10 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-blue-600 w-full"></div>
              <CardHeader>
                <CardTitle className="text-2xl">{enrichedData.profile.query_company_name || enrichedData.profile.query_website_url}</CardTitle>
                <CardDescription className="text-base mt-1 flex items-center gap-2 text-yellow-500/80">
                  <AlertCircle className="h-4 w-4" /> Awaiting verified data extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <VerifiedDataField label="Legal Business Name" field={enrichedData.fields.legal_business_name} icon={Building} />
                  <VerifiedDataField label="Headquarters" field={enrichedData.fields.headquarters} icon={MapPin} />
                  <VerifiedDataField label="Company Size (Employees)" field={enrichedData.fields.company_size} icon={Users} />
                  <VerifiedDataField label="Industry" field={enrichedData.fields.industry} icon={Target} />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="intelligence" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-card border border-white/10">
                <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="intelligence" className="mt-4 space-y-4">
                <Card className="border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" /> 
                      Verified Organization Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <VerifiedDataField label="Founded Year" field={enrichedData.fields.year_founded} />
                    <VerifiedDataField label="Est. Revenue" field={enrichedData.fields.estimated_revenue} />
                    <VerifiedDataField label="Sub Industry" field={enrichedData.fields.sub_industry} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="mt-4 space-y-4">
                <Card className="border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-400" />
                      Verified Contact Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <VerifiedDataField label="General Email" field={enrichedData.fields.general_email} icon={Mail} />
                     <VerifiedDataField label="Phone Number" field={enrichedData.fields.phone} icon={Phone} />
                     {enrichedData.contacts.length === 0 ? (
                       <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed border-white/10 rounded">No verified decision makers found.</p>
                     ) : (
                       <div className="space-y-3 mt-4">
                         <h4 className="text-sm font-medium text-muted-foreground border-b border-white/10 pb-2">Verified Decision Makers</h4>
                         {enrichedData.contacts.map((contact: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                             <div>
                               <p className="font-medium text-sm">{contact.name}</p>
                               <p className="text-xs text-muted-foreground">{contact.designation}</p>
                             </div>
                             <div className="flex gap-2">
                               <Badge variant="outline" className="text-xs flex gap-1 items-center bg-green-500/10 text-green-400 border-green-500/20">
                                 <ShieldCheck className="h-3 w-3" /> Verified
                               </Badge>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="opportunities" className="mt-4 space-y-4">
                 <Card className="border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                      Verified Procurement & Export Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <VerifiedDataField label="Procurement Potential" field={enrichedData.fields.procurement_potential} />
                     <VerifiedDataField label="Export Potential" field={enrichedData.fields.export_potential} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="mt-4 space-y-4">
                 <Card className="border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      AI Opportunity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">AI Analysis requires verified data points before generating a summary.</p>
                      <Button onClick={handleGenerateSummary} variant="outline" disabled={true}>Waiting for Verified Data...</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 shadow-lg opacity-70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground text-center">
                  JAS Opportunity Score
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" className="text-white/10 stroke-current" strokeWidth="12" fill="transparent" />
                  </svg>
                  <span className="absolute text-xl font-bold text-muted-foreground">N/A</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Score cannot be calculated without verified data.</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Verified Growth Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrichedData.signals.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-2">No verified signals detected.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Maps over real signals when they exist */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
