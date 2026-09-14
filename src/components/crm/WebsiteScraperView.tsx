import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Globe, Sparkles, Save, CheckCircle2, Building, Mail, Phone, MapPin, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const WebsiteScraperView = () => {
  const { profile, user } = useAuth() as any;
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    if (!url) {
      toast({ title: "Please enter a URL", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    setResult(null);
    setSaved(false);
    setProgress(10);

    try {
      // Ensure URL has protocol
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Simulate progress for UI
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 800);

      // 1. Fetch HTML via local proxy to bypass CORS and Cloudflare blocks
      let cleanUrl = targetUrl.trim(); if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl; const proxyUrl = `/api/scrape-website?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch website content.");
      }
      const html = await response.text();
      if (!html) throw new Error("Could not extract HTML from website.");

      setProgress(40);

      // 2. Clean HTML
      let textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      textContent = textContent.slice(0, 80000);

      setProgress(60);

      // 3. Analyze with Gemini locally
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env");

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
You are a top-tier business intelligence and CRM data extraction agent.
Analyze the following text content scraped from a company website (${targetUrl}) and extract key business information.
If a specific piece of information is not found, leave it empty or return "Not Found". Never hallucinate or generate fake people.

Expected JSON output format:
{
  "company": {
    "company_name": "...",
    "website_url": "...",
    "business_description": "...",
    "industry": "...",
    "sub_industry": "...",
    "year_founded": 2000,
    "headquarters": "...",
    "address": "...",
    "city": "...",
    "state": "...",
    "country": "...",
    "pincode": "...",
    "general_email": "...",
    "support_email": "...",
    "sales_email": "...",
    "phone_numbers": ["..."],
    "products": ["..."],
    "services": ["..."],
    "industries_served": ["..."],
    "target_customers": ["..."],
    "business_categories": ["..."],
    "keywords": ["..."]
  },
  "socials": [
    { "platform": "LinkedIn", "url": "..." }
  ],
  "contacts": [
    { "type": "email|phone|form", "label": "Vendor Registration Form", "value": "..." }
  ],
  "decision_makers": [
    { "name": "...", "designation": "...", "profile_url": "...", "company_role": "..." }
  ],
  "analysis": {
    "opportunity_score": 85,
    "overview": "...",
    "what_company_does": "...",
    "target_market": "...",
    "industry_classification": "...",
    "potential_business_opportunities": "...",
    "supplier_opportunity_analysis": "...",
    "distributor_opportunity_analysis": "...",
    "procurement_potential": "...",
    "export_potential": "...",
    "suggested_outreach_strategy": "...",
    "suggested_decision_makers_to_contact": "..."
  },
  "outreach_drafts": [
    { "type": "cold_email", "draft_content": "..." },
    { "type": "linkedin", "draft_content": "..." },
    { "type": "whatsapp", "draft_content": "..." }
  ]
}

Website text content:
${textContent}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      let structuredData;
      
      try {
        structuredData = JSON.parse(responseText);
        // Fallback for website URL if empty
        if (!structuredData.company.website_url || structuredData.company.website_url === "Not Found") {
          structuredData.company.website_url = targetUrl;
        }
      } catch (e) {
        throw new Error("AI returned invalid JSON");
      }

      clearInterval(interval);
      setProgress(100);
      setResult(structuredData);
      
      // AUTO-SAVE TO CRM DATABASE
      // This is the missing link! We must persist the data to the database immediately
      // so the Company Enrichment module can consume it.
      await handleSaveToCRM(structuredData);
      
      toast({ title: "Analysis Complete", description: "Successfully extracted and auto-saved company data." });
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCRM = async (dataToSave = result) => {
    console.log("=== DEBUG: handleSaveToCRM STARTED ===");
    console.log("user:", user);
    console.log("dataToSave:", dataToSave);
    
    if (!dataToSave || !user) {
      console.log("=== DEBUG: EXITING EARLY - Missing dataToSave or user ===");
      toast({ title: "Failed to save", description: "No data or active user found.", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
          user_id: user.id, // Guarantee we use auth.uid()
          company_name: dataToSave.company.company_name || "Unknown Company",
          website_url: dataToSave.company.website_url,
          business_description: dataToSave.company.business_description,
          industry: dataToSave.company.industry,
          sub_industry: dataToSave.company.sub_industry,
          year_founded: dataToSave.company.year_founded,
          headquarters: dataToSave.company.headquarters,
          address: dataToSave.company.address,
          city: dataToSave.company.city,
          state: dataToSave.company.state,
          country: dataToSave.company.country,
          pincode: dataToSave.company.pincode,
          general_email: dataToSave.company.general_email,
          support_email: dataToSave.company.support_email,
          sales_email: dataToSave.company.sales_email,
          phone_numbers: dataToSave.company.phone_numbers || [],
          products: dataToSave.company.products || [],
          services: dataToSave.company.services || [],
          industries_served: dataToSave.company.industries_served || [],
          target_customers: dataToSave.company.target_customers || [],
          business_categories: dataToSave.company.business_categories || [],
          keywords: dataToSave.company.keywords || []
      };
      console.log("=== DEBUG: Executing supabase.insert with payload ===", payload);

      // 1. Save Company
      const { data: company, error: companyErr } = await supabase
        .from('crm_companies')
        .insert(payload)
        .select()
        .single();

      console.log("=== DEBUG: Supabase crm_companies insert response ===", { company, companyErr });

      if (companyErr) throw companyErr;

      // 2. Save Socials
      if (dataToSave.socials && dataToSave.socials.length > 0) {
        await supabase.from('crm_company_socials').insert(
          dataToSave.socials.map((s: any) => ({
            company_id: company.id,
            platform: s.platform,
            url: s.url
          }))
        );
      }

      // 3. Save Contacts
      if (dataToSave.contacts && dataToSave.contacts.length > 0) {
        await supabase.from('crm_company_contacts').insert(
          dataToSave.contacts.map((c: any) => ({
            company_id: company.id,
            type: c.type || "email",
            label: c.label || "Contact",
            value: c.value
          }))
        );
      }

      // 4. Save Decision Makers
      if (dataToSave.decision_makers && dataToSave.decision_makers.length > 0) {
        await supabase.from('crm_decision_makers').insert(
          dataToSave.decision_makers.map((dm: any) => ({
            company_id: company.id,
            name: dm.name || "Unknown",
            designation: dm.designation,
            profile_url: dm.profile_url,
            company_role: dm.company_role
          }))
        );
      }

      // 5. Save Analysis
      if (dataToSave.analysis) {
        await supabase.from('crm_company_analysis').insert({
          company_id: company.id,
          ...dataToSave.analysis
        });
      }

      // 6. Save Outreach Drafts
      if (dataToSave.outreach_drafts && dataToSave.outreach_drafts.length > 0) {
        await supabase.from('crm_outreach_recommendations').insert(
          dataToSave.outreach_drafts.map((od: any) => ({
            company_id: company.id,
            type: od.type || "cold_email",
            draft_content: od.draft_content
          }))
        );
      }

      setSaved(true);
      console.log("=== DEBUG: Successfully inserted all related records. Company ID:", company.id);
    } catch (err: any) {
      console.error("=== DEBUG: Database Insert Failed ===", err);
      toast({ title: "Failed to persist to database", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Website Scraper & AI Research</h1>
          <p className="text-muted-foreground text-sm">Transform any company website into a rich CRM profile.</p>
        </div>
      </div>

      <Card className="bg-card/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex gap-3 items-center">
            <Input 
              placeholder="Enter company website URL (e.g., https://apple.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 text-lg bg-background border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="h-12 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analyzing..." : "Analyze Website"}
            </Button>
          </div>
          
          {loading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Scraping & AI extraction in progress...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Analysis Results for {result.company.company_name}
            </h2>
            <Button onClick={handleSaveToCRM} disabled={saving || saved} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />)}
              {saved ? "Saved to CRM" : "Save to CRM"}
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 bg-card/40 border border-white/5 h-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts & Socials</TabsTrigger>
              <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="bg-card/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Building className="h-4 w-4 text-primary" /> Company Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Company Name</p>
                    <p className="font-medium">{result.company.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="font-medium text-primary"><a href={result.company.website_url} target="_blank" rel="noreferrer">{result.company.website_url}</a></p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{result.company.business_description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="font-medium">{result.company.industry} {result.company.sub_industry ? `(${result.company.sub_industry})` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Headquarters</p>
                    <p className="font-medium">{result.company.headquarters || result.company.city}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Extracted Contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.company.general_email && <div className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {result.company.general_email} (General)</div>}
                    {result.company.support_email && <div className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {result.company.support_email} (Support)</div>}
                    {result.company.sales_email && <div className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {result.company.sales_email} (Sales)</div>}
                    {result.company.phone_numbers?.map((p: string, i: number) => <div key={i} className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {p}</div>)}
                    {result.contacts?.map((c: any, i: number) => <div key={i} className="flex gap-2 text-sm"><strong>{c.label}:</strong> {c.value}</div>)}
                  </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Socials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.socials?.length > 0 ? result.socials.map((s: any, i: number) => (
                      <div key={i}><a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{s.platform}</a></div>
                    )) : <p className="text-muted-foreground text-sm">No socials found.</p>}
                  </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/5 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Decision Makers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.decision_makers?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {result.decision_makers.map((dm: any, i: number) => (
                          <div key={i} className="p-3 border border-white/5 bg-white/[0.02] rounded-lg">
                            <p className="font-semibold">{dm.name}</p>
                            <p className="text-xs text-muted-foreground">{dm.designation || dm.company_role}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-muted-foreground text-sm">No decision makers clearly identified.</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-4 mt-4">
              <Card className="bg-card/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Insights</span>
                    <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">Score: {result.analysis?.opportunity_score}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Target Market</h3>
                    <p className="text-sm">{result.analysis?.target_market}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Potential Business Opportunities</h3>
                    <p className="text-sm">{result.analysis?.potential_business_opportunities}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Supplier Potential</h3>
                      <p className="text-sm">{result.analysis?.supplier_opportunity_analysis}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Procurement Potential</h3>
                      <p className="text-sm">{result.analysis?.procurement_potential}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Suggested Strategy</h3>
                    <p className="text-sm">{result.analysis?.suggested_outreach_strategy}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outreach" className="space-y-4 mt-4">
              {result.outreach_drafts?.map((draft: any, i: number) => (
                <Card key={i} className="bg-card/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">{draft.type.replace('_', ' ')} Draft</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-white/5 p-4 rounded-xl border border-white/5 text-foreground/90">
                      {draft.draft_content}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
