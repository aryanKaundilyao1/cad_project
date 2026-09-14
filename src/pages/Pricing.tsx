import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { CheckCircle2, HelpCircle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Pricing() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background text-foreground pt-16">
        
        {/* ── HEADER ── */}
        <section className="relative pt-20 pb-16 overflow-hidden bg-primary/5 border-b border-primary/20">
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <ScrollReveal>
              <h1 className="text-5xl md:text-7xl font-editorial tracking-tight leading-tight tracking-tight mb-6 text-foreground">
                Pricing based on <span className="text-primary italic">Platform Access.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                We don't sell guaranteed lead quotas because we don't sell lists. We sell access to an intelligent, verified ecosystem designed for B2B growth.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── PRICING TIERS ── */}
        <section className="pb-24 pt-8 bg-primary/5 border-b border-primary/20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              {/* Essential Plan */}
              <ScrollReveal delay={0.1}>
                <div className="border border-primary/20 bg-card rounded-none h-full p-8 rounded-none border border-primary/20 bg-card flex flex-col hover:border-white/20 transition-all">
                  <h3 className="text-2xl font-editorial font-bold text-foreground mb-2">Essential</h3>
                  <p className="text-sm text-muted-foreground mb-6 h-10">For small businesses establishing a digital presence.</p>
                  <div className="mb-8">
                    <span className="text-5xl font-editorial font-bold text-foreground">₹2,999</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <Link to="/auth" className="w-full mb-8">
                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-foreground" size="lg">Get Started</Button>
                  </Link>
                  <ul className="space-y-4 flex-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Basic Marketplace Listing</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Core Opportunity Intelligence</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>10 Research Credits / month</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Save up to 50 Opportunities</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Email Support</span></li>
                    <li className="flex items-start gap-3 text-white/30"><X className="w-5 h-5 shrink-0" /> <span>Company Verification Shield</span></li>
                    <li className="flex items-start gap-3 text-white/30"><X className="w-5 h-5 shrink-0" /> <span>Premium Visibility</span></li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Professional Plan */}
              <ScrollReveal delay={0.2}>
                <div className="border border-primary/20 bg-card rounded-none h-full p-8 rounded-none border border-primary/50 bg-primary/5 flex flex-col relative shadow-[0_0_40px_rgba(34,211,238,0.15)] transform lg:-translate-y-4">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary/20 text-xs font-bold text-primary uppercase tracking-wider">Popular</div>
                  <h3 className="text-2xl font-editorial font-bold text-foreground mb-2">Professional</h3>
                  <p className="text-sm text-muted-foreground mb-6 h-10">For active sales teams closing deals.</p>
                  <div className="mb-8">
                    <span className="text-5xl font-editorial font-bold text-foreground">₹7,999</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <Link to="/auth" className="w-full mb-8">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">Start Free Trial</Button>
                  </Link>
                  <ul className="space-y-4 flex-1 text-sm text-foreground">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Premium Visibility Listing</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Unlimited Opportunity Access</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>50 Research Credits / month</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Unlimited Saved Opportunities</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Company Verification Shield</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Advanced Analytics</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>AI Scoring Features</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Priority Support</span></li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Enterprise Plan */}
              <ScrollReveal delay={0.3}>
                <div className="border border-primary/20 bg-card rounded-none h-full p-8 rounded-none border border-primary/20 bg-card flex flex-col hover:border-white/20 transition-all">
                  <h3 className="text-2xl font-editorial font-bold text-foreground mb-2">Enterprise</h3>
                  <p className="text-sm text-muted-foreground mb-6 h-10">For massive scale and custom extraction.</p>
                  <div className="mb-8">
                    <span className="text-5xl font-editorial font-bold text-foreground">Custom</span>
                  </div>
                  <Link to="/contact" className="w-full mb-8">
                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-foreground" size="lg">Contact Sales</Button>
                  </Link>
                  <ul className="space-y-4 flex-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Everything in Professional</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>API Access</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Custom Intelligence Pipelines</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Unlimited Research Credits</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Multiple Team Accounts</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Dedicated Account Manager</span></li>
                  </ul>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* ── FAQ PRICING DETAILS ── */}
        <section className="py-24" >
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="section-heading mb-12">Why we don't sell "Lead Packs"</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="p-6 rounded-2xl border border-white/5 bg-card">
                <h4 className="font-bold text-lg text-foreground mb-3">Quality vs Quantity</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Platforms that sell "100 leads for $50" incentivize their algorithms to prioritize volume over relevance. You end up with spreadsheets full of outdated emails and unqualified prospects. We charge for platform access so our only incentive is to provide high-fidelity, accurate intelligence.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-card">
                <h4 className="font-bold text-lg text-foreground mb-3">The Verification Shield</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Professional members receive a Verification Shield on their marketplace profile. This signals to the ecosystem that your business has passed our basic due diligence checks, increasing trust and inbound inquiries.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}