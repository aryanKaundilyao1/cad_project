const fs = require('fs');
const path = require('path');

const indexContent = `import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  ArrowRight, ShieldCheck, Database, LineChart, Network,
  Lightbulb, ChevronRight, CheckCircle2,
  BarChart3, Users, LayoutDashboard, Target
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-dot-grid" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(222 47% 7%) 100%)' }}>
        <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-0 left-0 opacity-20" />
        <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] bottom-0 right-0 opacity-10" style={{ animationDelay: '-3s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground mb-8">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>B2B Opportunity Intelligence</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-foreground leading-[1.1]">
                From market noise to <br className="hidden md:block" />
                <span className="text-gradient-blue">ranked opportunities.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                JAS Connect is a B2B Opportunity Intelligence & Prioritization platform that tells sales teams which opportunities to pursue first, why they matter, and what to do next.
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

      {/* ═══ 2. THE PROBLEM ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Businesses don't have a lead problem.
                <span className="block text-muted-foreground mt-2">They have a prioritization problem.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Every quarter, sales teams manually research fragmented data sources with no single view. There is no structured way to separate real buyers from noise. Guesswork replaces strategy and deals slip through.
              </p>
              <p className="text-lg text-foreground leading-relaxed font-medium">
                The real cost isn't missing leads, it's pursuing the wrong ones. 
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 3. THE INSIGHT / WHY THIS EXISTS ═══ */}
      <section className="py-24" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground tracking-tight">
              Why JAS Exists
            </h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              The real problem isn't bad leads. It's that every business defines a good opportunity differently. Context-blind prioritisation is the root cause — and no amount of more data fixes a broken definition of fit.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] h-full">
                <h3 className="text-xl font-bold text-foreground mb-4">Too Many Prospects</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Too many prospects and limited selling hours. Manual research across fragmented data sources with no single view of the opportunity landscape.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] h-full">
                <h3 className="text-xl font-bold text-foreground mb-4">Zero Prioritization Logic</h3>
                <p className="text-muted-foreground leading-relaxed">
                  What qualifies as an opportunity depends on capability, geography, eligibility, timing, and capacity. One-size-fits-all scoring is why sales intelligence tools fail B2B companies.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 4. HOW JAS WORKS (THE ENGINE) ═══ */}
      <section className="py-24 relative overflow-hidden bg-dot-grid">
        <div className="glow-orb glow-orb-blue w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">How JAS Works</h2>
            <p className="text-lg text-muted-foreground mt-4">From zero to deployment in 72 hours.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0.1}>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] relative group hover:border-primary/50 transition-colors h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">1. Input: Business DNA</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your capabilities, geographic service radius, design codes, installed capacity, and documentable eligibility are captured as a machine-readable capability envelope.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] relative group hover:border-primary/50 transition-colors h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">2. Process: Qualify & Score</h3>
                <p className="text-muted-foreground leading-relaxed">
                  JAS qualifies, scores, and ranks every opportunity against your specific definition of fit. Seven qualification gates run first. Only opportunities that pass all gates get scored.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] relative group hover:border-primary/50 transition-colors h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <LineChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">3. Output: Ranked Actions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A prioritised list with scores, evidence confidence, supporting evidence trails, and recommended next actions. Sales teams focus only on what is real, reachable, and winnable.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 5. WHY JAS IS DIFFERENT ═══ */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Why JAS is Different</h2>
          </ScrollReveal>
          
          <div className="space-y-12">
            <ScrollReveal delay={0.1}>
              <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] p-8 rounded-3xl border border-white/10">
                <div className="md:w-1/3 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                </div>
                <div className="md:w-2/3 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Qualification Gates First</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Not more leads — better prioritization of the leads that actually matter. Qualification is a gate, not a score. Ineligible opportunities are removed, not just ranked lower.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex flex-col md:flex-row-reverse gap-8 items-center bg-white/[0.02] p-8 rounded-3xl border border-white/10">
                <div className="md:w-1/3 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <div className="md:w-2/3 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Score + Confidence</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Evidence Confidence is separate from Opportunity Score — so you know what you know and what you don't. Every recommendation is explainable and traceable to its sources. No black box predictions.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 6. CTA ═══ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: 'hsl(222 47% 5%)' }}>
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

const aboutContent = `import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowRight, Lightbulb, Workflow, Cpu, Box, Database, Search } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-dot-grid" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(222 47% 7%) 100%)' }}>
        <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] top-0 right-0 opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
                Turning market noise into <br className="hidden md:block" />
                <span className="text-gradient-blue">clear commercial strategy.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                JAS Connect is built around one central idea: Every business has a different definition of a valuable opportunity. We turn that definition into a repeatable system.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM WE SOLVE ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">The Fundamental Problem</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Most B2B sales teams don't necessarily suffer from a lack of data. They suffer from too much poorly prioritized data.
            </p>
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-left mb-8">
              <p className="text-muted-foreground mb-4">A company may have thousands of contacts, CRM accounts, inquiries, intent signals, and enriched data rows. Yet the salesperson still has to answer:</p>
              <p className="text-2xl font-bold text-primary italic">"Who should I actually contact first?"</p>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              That decision is frequently based on manual research, simplistic scoring, static ICPs, salesperson intuition, or generic intent signals. That decision layer is where JAS sits.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ ARCHITECTURE ═══ */}
      <section className="py-24" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">The JAS Architecture</h2>
            <p className="text-muted-foreground text-lg">Our product can be understood as six core layers.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Layer 1: Business Understanding", desc: "JAS learns your Company + Product + Market + Buyer + Commercial Constraints.", icon: Box },
              { title: "Layer 2: Opportunity Discovery", desc: "JAS creates a candidate universe from relevant sources.", icon: Search },
              { title: "Layer 3: Qualification", desc: "JAS asks: 'Should this opportunity even be considered?' using hard entity gates.", icon: Workflow },
              { title: "Layer 4: Intelligence & Scoring", desc: "For qualified opportunities: Enrichment + Signals + Opportunity Score + Evidence Confidence.", icon: Lightbulb },
              { title: "Layer 5: Prioritization", desc: "JAS determines what deserves attention first, why, and why now.", icon: Database },
              { title: "Layer 6: Outcome Learning", desc: "Sales actions produce outcomes which eventually improve your engine.", icon: Cpu }
            ].map((layer, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <layer.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{layer.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{layer.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CURRENT STAGE ═══ */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Where JAS is Going</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              JAS Connect has moved beyond initial ideation. We are building the industry's first reusable, industry-specific scoring and opportunity-engine templates, beginning with PEB and structural steel in India, and subsequently expanding to exporter-focused global opportunity intelligence.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              We are currently in a design partner phase, translating our completed architecture into configurable software, validating qualification, scoring and ranking assumptions with real sales-teams, before introducing data-driven automated recalibration.
            </p>
            <Button size="xl" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/book-demo')}>
              Join our Design Partner Program
            </Button>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
`

fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'Index.tsx'), indexContent);
fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'About.tsx'), aboutContent);
console.log('Pages updated successfully');
