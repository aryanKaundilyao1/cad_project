import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIndustries } from "@/hooks/useBusinessProfile";
import { trackEvent } from "@/utils/analytics";

const COMPANY_SIZES = [
  "1-10 Employees",
  "11-50 Employees",
  "51-200 Employees",
  "201-500 Employees",
  "501+ Employees",
] as const;

const LEAD_SOURCES = [
  "Organic Search",
  "Referral",
  "Social Media",
  "Direct Mail",
  "Cold Call",
  "Event / Trade Show",
  "Other",
] as const;
import { Sparkles } from "lucide-react";

const PostProject = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const { data: industries = [] } = useIndustries();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [leadType, setLeadType] = useState("New Business Lead");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [timeline, setTimeline] = useState("");
  const [urgency, setUrgency] = useState("");
  
  // Universal business lead fields
  const [companySize, setCompanySize] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [website, setWebsite] = useState("");
  const [decisionMakerName, setDecisionMakerName] = useState("");
  const [decisionMakerTitle, setDecisionMakerTitle] = useState("");
  const [technicalNotes, setTechnicalNotes] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>You need to sign in to submit a lead.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const parseBudget = (val: string) => {
    if (!val) return null;
    let parsed = val.toLowerCase().replace(/,/g, '').trim();
    let multiplier = 1;
    if (parsed.includes('cr') || parsed.includes('crore')) multiplier = 10000000;
    else if (parsed.includes('lakh') || parsed.includes('l') || parsed.includes('lac')) multiplier = 100000;
    else if (parsed.includes('k') || parsed.includes('thousand')) multiplier = 1000;
    
    const num = parseFloat(parsed.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return num * multiplier;
  };

  const validateLead = () => {
    if (!title || title.trim().length < 5) return "Lead title must be at least 5 characters.";
    if (!location || location.trim().length < 3) return "Please enter a valid location.";

    const min = parseBudget(budgetMin);
    const max = parseBudget(budgetMax);

    if (min && min < 10000) return "Budget minimum cannot be less than ₹10,000.";
    if (min && max && min >= max) return "Budget minimum must be less than maximum.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast({ title: "Profile not loaded", description: "Please try again.", variant: "destructive" });
      return;
    }

    const validationError = validateLead();
    if (validationError) {
      toast({ title: "Invalid Input", description: validationError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const finalCategory = category === "Other" ? customCategory : category;

      // Create lead
      console.log('Lead submitted');
      const leadPayload = {
        seller_id: profile.id,
        title,
        description,
        location,
        project_type: "N/A",
        category: finalCategory || null,
        budget_min: parseBudget(budgetMin),
        budget_max: parseBudget(budgetMax),
        timeline: timeline || null,
        urgency: urgency || null,
        company_size: companySize || null,
        lead_source: leadSource || null,
        website: website || null,
        decision_maker_name: decisionMakerName || null,
        decision_maker_title: decisionMakerTitle || null,
        technical_notes: technicalNotes || null,
        status: "Active",
        verification_status: "pending",
        is_verified: false,
        is_public: false,
        approved_by: null,
        approved_at: null,
        published_at: null,
        created_by: user.id,
        submitted_by: user.id,
        submitted_source: "user_submission"
      };
      
      console.log(leadPayload);
      console.log(leadPayload.status);
      console.log(leadPayload.verification_status);

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert(leadPayload)
        .select()
        .single();

      if (leadError) throw leadError;

      // Upload images
      if (images.length > 0 && lead) {
        for (let i = 0; i < images.length; i++) {
          const fileName = `${lead.id}/${Date.now()}-${images[i].file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("lead-images")
            .upload(fileName, images[i].file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("lead-images")
              .getPublicUrl(fileName);

            await supabase.from("lead_images").insert({
              lead_id: lead.id,
              image_url: urlData.publicUrl,
              is_primary: i === 0,
            });
          }
        }
      }

      trackEvent('requirement_posted', { category: finalCategory, budget_min: parseBudget(budgetMin), budget_max: parseBudget(budgetMax) });
      setSubmitted(true);
      toast({ title: "Lead Submitted!", description: "Your lead has been submitted for review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <Card className="max-w-md mx-4 animate-scale-in">
            <CardHeader className="text-center">
              <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-display">Lead Submitted!</CardTitle>
              <CardDescription className="text-base">
                Your lead has been submitted for review. It will go live once verified by our team (usually within 24 hours).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate("/dashboard")} className="w-full">Go to Dashboard</Button>
              <Button onClick={() => navigate("/tenders")} variant="outline" className="w-full">Browse Leads</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1 pt-16">
        <section className="bg-gradient-to-b from-background to-secondary py-8">
          <div className="container mx-auto px-4">
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-3xl font-display font-bold mb-2">Submit a New Lead</h1>
            <p className="text-muted-foreground">Provide business lead details for verification and matching.</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Lead Title *</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., SaaS Platform Development Lead" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed requirements or opportunity description..." rows={4} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State or Remote" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {industries.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {category === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customCategory">Custom Industry *</Label>
                      <Input id="customCategory" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Enter industry" required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Lead Type *</Label>
                    <Select value={leadType} onValueChange={setLeadType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Business Lead">New Business Lead</SelectItem>
                        <SelectItem value="Partnership Opportunity">Partnership Opportunity</SelectItem>
                        <SelectItem value="Service Requirement">Service Requirement</SelectItem>
                        <SelectItem value="Product Inquiry">Product Inquiry</SelectItem>
                        <SelectItem value="Consultation Request">Consultation Request</SelectItem>
                        <SelectItem value="Vendor Search">Vendor Search</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select value={urgency} onValueChange={setUrgency}>
                        <SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline</Label>
                      <Input id="timeline" value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g., Q3 2026" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budgetMin">Budget Min (₹)</Label>
                      <Input id="budgetMin" type="text" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="e.g., 50 Lakh" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">Budget Max (₹)</Label>
                      <Input id="budgetMax" type="text" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="e.g., 2 Cr" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Details (replaces Engineering Specifications) */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>Additional information helps us match better prospects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Size</Label>
                      <Select value={companySize} onValueChange={setCompanySize}>
                        <SelectTrigger><SelectValue placeholder="Select company size" /></SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map(size => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lead Source</Label>
                      <Select value={leadSource} onValueChange={setLeadSource}>
                        <SelectTrigger><SelectValue placeholder="How did you find this lead?" /></SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map(source => (
                            <SelectItem key={source} value={source}>{source}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website (Optional)</Label>
                    <Input id="website" type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="e.g. www.example.com" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="decisionMakerName">Decision Maker Name</Label>
                      <Input id="decisionMakerName" value={decisionMakerName} onChange={e => setDecisionMakerName(e.target.value)} placeholder="e.g., John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decisionMakerTitle">Decision Maker Title</Label>
                      <Input id="decisionMakerTitle" value={decisionMakerTitle} onChange={e => setDecisionMakerTitle(e.target.value)} placeholder="e.g., VP of Sales" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technicalNotes">Additional Notes</Label>
                    <Textarea id="technicalNotes" value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} placeholder="Any additional context, requirements, or specifications..." rows={3} />
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                  <CardDescription>Upload documents, screenshots, or relevant files (max 5)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={images.length >= 5}>
                    <Upload className="h-4 w-4" /> Upload Files ({images.length}/5)
                  </Button>
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                          <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                <p><strong>Note:</strong> Your lead will be reviewed by our team before going live (usually within 24 hours). Once verified, interested buyers can unlock and contact you directly.</p>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {loading ? "Submitting..." : "Submit Lead"}
              </Button>
            </form>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PostProject;
