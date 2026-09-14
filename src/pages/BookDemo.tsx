import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, HardHat } from "lucide-react";

const BookDemo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "vendor" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    location: "",
    gst_number: "",
    portfolio_url: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!role) return;
    if (!form.full_name || !form.company_name || !form.email || !form.phone) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await ((supabase as any).from("demo_requests") as any).insert([{ ...form, role }]);
    setLoading(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-md mx-auto px-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Request Received!</h2>
            <p className="text-muted-foreground">
              Thanks <strong>{form.full_name}</strong>! Our team will review your details and contact you at <strong>{form.email}</strong> within 24 hours to schedule a personalised demo.
            </p>
            <p className="text-sm text-muted-foreground">📞 You can also reach us at +91 9971867719</p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 py-12 relative">
        
        
        <div className="container mx-auto px-4 max-w-2xl relative z-10">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Book a Demo</h1>
            <p className="text-muted-foreground">Tell us who you are and we'll tailor the demo for you.</p>
          </div>

          {/* Step 1: Role Selection */}
          {!role && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setRole("client")}
              >
                <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                  <Building2 className="h-10 w-10 text-primary" />
                  <CardTitle>I'm a Client</CardTitle>
                  <CardDescription>I post project requirements and look for vendors/contractors</CardDescription>
                  <Badge variant="outline">Post RFQs</Badge>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setRole("vendor")}
              >
                <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                  <HardHat className="h-10 w-10 text-primary" />
                  <CardTitle>I'm a Contractor / Vendor</CardTitle>
                  <CardDescription>I find leads and bid on projects relevant to my work</CardDescription>
                  <Badge variant="outline">Unlock Leads</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Form */}
          {role && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {role === "client" ? "Client Details" : "Vendor / Contractor Details"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setRole(null)}>← Change</Button>
                </div>
                <CardDescription>
                  All fields marked * are required. This helps us customise your demo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" placeholder="Aryan Sharma" value={form.full_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input id="company_name" placeholder="Acme Corp" value={form.company_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" placeholder="+91 9999999999" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Delhi, Mumbai, etc." value={form.location} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input id="gst_number" placeholder="22AAAAA0000A1Z5" value={form.gst_number} onChange={handleChange} />
                </div>

                {role === "vendor" && (
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url">Portfolio / Website URL</Label>
                    <Input id="portfolio_url" placeholder="https://yourcompany.com" value={form.portfolio_url} onChange={handleChange} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {role === "client" ? "Describe your typical project requirements" : "Describe your work / services"}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={role === "client" ? "e.g. We manage civil infra projects in North India..." : "e.g. We are a fit-out contractor specialising in commercial interiors..."}
                    rows={4}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Request Demo →"}
                </Button>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookDemo;