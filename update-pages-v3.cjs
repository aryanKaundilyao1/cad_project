const fs = require('fs');
const path = require('path');

const indexContent = `import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  ArrowRight, ShieldCheck, Database, LineChart, Target,
  CheckCircle2, Search, Zap, Layers, Cpu, Compass
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* ═══ 1. HERO (SIMPLE & CENTERED) ═══ */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-dot-grid" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(222 47% 6%) 100%)' }}>
        <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-0 left-1/2 -translate-x-1/2 opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>B2B Opportunity Intelligence</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground leading-[1.1]">
                From market noise to <br className="hidden md:block" />
                <span className="text-gradient-blue">ranked opportunities.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                JAS Connect transforms fragmented market evidence into qualified, explainable, and continuously improving opportunity rankings through client-specific commercial DNA.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="xl" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(34,211,238,0.2)]" onClick={() => navigate('/book-demo')}>
                  Book a Demo <ArrowRight className="h-5 w-5" />
                </Button>
                {!user && (
                  <Button size="xl" variant="outline" className="gap-2 border-white/10 hover:bg-white/5" onClick={() => navigate('/auth')}>
                    Login to Platform
                  </Button>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 2. METRICS BANNER ═══ */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="py-4">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">80%</div>
                <div className="text-sm font-medium text-foreground uppercase tracking-wider mb-1">Time Saved</div>
                <div className="text-sm text-muted-foreground">Reduction in manual sales outreach & research time.</div>
              </div>
              <div className="py-4">
                <div className="text-4xl md:text-5xl font-bold text-accent mb-2">85%+</div>
                <div className="text-sm font-medium text-foreground uppercase tracking-wider mb-1">Accuracy</div>
                <div className="text-sm text-muted-foreground">High precision in qualification and ICP matching.</div>
              </div>
              <div className="py-4">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">3x</div>
                <div className="text-sm font-medium text-foreground uppercase tracking-wider mb-1">Conversion Potential</div>
                <div className="text-sm text-muted-foreground">Focus only on real, reachable, winnable deals.</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ 3. THE PROBLEM ═══ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Businesses don't have a lead problem.
              </h2>
              <p className="text-xl text-muted-foreground mb-12">They have a prioritization problem.</p>
            </ScrollReveal>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal delay={0.1}>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Every quarter, sales teams manually research fragmented data sources with no single view. There is no structured way to separate real buyers from noise. Guesswork replaces strategy and deals slip through.
              </p>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
                <p className="text-xl text-foreground font-medium italic">
                  "Who should I actually contact first?"
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  The JAS Resolution: "Here are the 20 opportunities your team should care about today. And here is exactly why."
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 4. OUR SERVICES ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Our Services & Capabilities</h2>
            <p className="text-lg text-muted-foreground mt-4">Comprehensive intelligence infrastructure tailored for your business.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0.1}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Configurable Opportunity Engines</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We build customized scoring engines around your specific capabilities, geography, eligibility, and commercial constraints.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Industry Intelligence Templates</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Deploy faster using our pre-built, reusable architectural templates (starting with PEB and structural steel) tailored with your unique overrides.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <LineChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Outcome-Driven Recalibration</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our system learns from your actual sales outcomes (meetings, RFQs, won/lost deals) to continuously improve scoring accuracy over time.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 5. OUR UNIQUE SELLING PROPOSITIONS (USPs) ═══ */}
      <section className="py-24" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Our Core USPs</h2>
            <p className="text-lg text-muted-foreground mt-4">Why the JAS architecture outperforms generic alternatives.</p>
          </ScrollReveal>
          
          <div className="space-y-8">
            <ScrollReveal delay={0.1}>
              <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] p-8 rounded-3xl border border-white/10">
                <div className="md:w-1/4 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                </div>
                <div className="md:w-3/4 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Qualification Gates First</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Qualification is a gate, not a score. We use 7 strict criteria (Entity Validity, Buyer Type, Product Compatibility, Geographic, Regulatory, Commercial Feasibility, Minimum Evidence) to eliminate garbage before scoring even begins.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] p-8 rounded-3xl border border-white/10">
                <div className="md:w-1/4 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
                <div className="md:w-3/4 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Score + Confidence Separation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Opportunity attractiveness and certainty are different questions. Evidence Confidence is completely separated from the Opportunity Score — so you always know what you know and what you don't.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] p-8 rounded-3xl border border-white/10">
                <div className="md:w-1/4 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center">
                    <Compass className="w-8 h-8" />
                  </div>
                </div>
                <div className="md:w-3/4 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Total Explainability</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    No black-box AI magic. Every recommendation is traceable to its exact signals and evidence sources, complete with timestamps and commercial triggers that explain precisely "Why Now".
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 6. CTA ═══ */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-background">
        <div className="glow-orb glow-orb-blue w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight">
              Ready to stop searching?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Focus your sales team on opportunities that are real, reachable, and winnable.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="xl" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(34,211,238,0.3)]" onClick={() => navigate('/book-demo')}>
                Book Demo <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
`

fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'Index.tsx'), indexContent);
console.log('Index page updated successfully');
