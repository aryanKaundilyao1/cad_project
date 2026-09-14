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
  CheckCircle2, Search, Zap, Layers, AlertCircle, ArrowUpRight,
  BarChart, Activity, XCircle, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* ═══ 1. HERO WITH DASHBOARD PREVIEW ═══ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-dot-grid" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(222 47% 6%) 100%)' }}>
        <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-0 left-0 opacity-20" />
        <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] bottom-0 right-0 opacity-10" style={{ animationDelay: '-3s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            
            {/* Hero Text */}
            <div className="text-left">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>B2B Opportunity Intelligence</span>
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={0.1}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground leading-[1.1]">
                  From market noise to <br />
                  <span className="text-gradient-blue">ranked opportunities.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                  JAS Connect transforms fragmented market evidence into qualified, explainable, and continuously improving opportunity rankings through client-specific commercial DNA.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="flex flex-wrap gap-4">
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

            {/* Hero Mockup (The Output) */}
            <ScrollReveal delay={0.4} className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl blur-2xl"></div>
              <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">jas-opportunity-engine</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-xs text-primary font-medium tracking-wider uppercase">Priority #1</div>
                      <h3 className="text-2xl font-bold text-foreground">ACME Industrial Ltd.</h3>
                      <p className="text-sm text-muted-foreground">Warehouse PEB • NCR Region</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                        <BarChart className="w-3 h-3 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">Score: 87/100</span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400">Confidence: 91/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                        <Search className="w-4 h-4 text-primary" /> Why this opportunity?
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Verified plant expansion announced Q3. matches exact technical capability envelope for 200k sq.ft structures.</p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                        <Clock className="w-4 h-4 text-accent" /> Why now?
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Environmental clearance filed 14 days ago. Procurement phase typically begins within 45 days of clearance.</p>
                    </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl mt-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-red-200 block mb-1">Potential Concern</span>
                      <span className="text-xs text-red-300/70">Strong historical relationship with competitor (InfraBuild). Requires technical differentiation in outreach.</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 group">
                    View Complete Evidence Trail <ArrowUpRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 2. THE PROBLEM (CONTRAST) ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Businesses don't have a lead problem.
              </h2>
              <p className="text-xl text-muted-foreground">They have a prioritization problem.</p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScrollReveal delay={0.1}>
              <div className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 h-full opacity-80">
                <h3 className="text-xl font-bold text-red-200 mb-6 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-400" /> The Status Quo
                </h3>
                <ul className="space-y-4 text-muted-foreground text-sm">
                  <li className="flex gap-3"><span className="text-red-400">•</span> 5,000 unverified database contacts</li>
                  <li className="flex gap-3"><span className="text-red-400">•</span> Generic intent signals with no context</li>
                  <li className="flex gap-3"><span className="text-red-400">•</span> Manual research across fragmented sources</li>
                  <li className="flex gap-3"><span className="text-red-400">•</span> One-size-fits-all generic lead scoring</li>
                </ul>
                <div className="mt-8 pt-6 border-t border-red-500/10">
                  <p className="font-medium text-foreground">The Salesperson's Dilemma:</p>
                  <p className="text-red-300/70 italic mt-2">"Who should I actually contact first?"</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-3xl border border-primary/30 bg-primary/5 h-full relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" /> The JAS Experience
                </h3>
                <ul className="space-y-4 text-foreground/80 text-sm">
                  <li className="flex gap-3 items-start"><span className="text-primary mt-1"><Target className="w-4 h-4"/></span> Only opportunities that pass 7 strict eligibility gates.</li>
                  <li className="flex gap-3 items-start"><span className="text-primary mt-1"><Layers className="w-4 h-4"/></span> Scoring custom-built around your actual commercial DNA.</li>
                  <li className="flex gap-3 items-start"><span className="text-primary mt-1"><Search className="w-4 h-4"/></span> Evidence confidence completely separated from the score.</li>
                  <li className="flex gap-3 items-start"><span className="text-primary mt-1"><Zap className="w-4 h-4"/></span> Ranked recommendations with explainable 'Why Now' context.</li>
                </ul>
                <div className="mt-8 pt-6 border-t border-primary/20">
                  <p className="font-medium text-foreground">The JAS Resolution:</p>
                  <p className="text-primary/90 italic mt-2">"Here are the 20 opportunities your team should care about today. And here is exactly why."</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 3. JAS VS EXISTING STACK ═══ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">JAS vs. The Existing Stack</h2>
            <p className="text-lg text-muted-foreground mt-4">Understanding where we fit in your go-to-market infrastructure.</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScrollReveal delay={0.1}>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Databases</h4>
                <p className="text-lg font-semibold text-foreground mb-2">"Who exists?"</p>
                <p className="text-sm text-muted-foreground">Raw lists of contacts and companies without your commercial context.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">GTM Engines</h4>
                <p className="text-lg font-semibold text-foreground mb-2">"How to enrich?"</p>
                <p className="text-sm text-muted-foreground">Sophisticated workflow builders that require you to invent the methodology.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">CRM</h4>
                <p className="text-lg font-semibold text-foreground mb-2">"What happened?"</p>
                <p className="text-sm text-muted-foreground">Systems of record for pipeline management and historical relationship tracking.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div className="p-6 rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <h4 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">JAS Connect</h4>
                <p className="text-lg font-semibold text-foreground mb-2">"Who to pursue?"</p>
                <p className="text-sm text-primary/80">The specialized decision layer determining what actually deserves your attention first.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 4. HOW JAS WORKS (THE ENGINE) ═══ */}
      <section className="py-24 relative overflow-hidden bg-dot-grid" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">The 72-Hour Engine</h2>
            <p className="text-lg text-muted-foreground mt-4">We configure the intelligence engine specifically to your business in three steps.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-0"></div>
            
            <ScrollReveal delay={0.1} className="relative z-10">
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 ring-4 ring-background">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">1. Commercial DNA</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We map your exact product configurations, market restrictions, negative ICPs, and capability constraints.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className="relative z-10">
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 ring-4 ring-background">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">2. Qualify & Score</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Seven hard gates filter out ineligible noise. Only survivors are evaluated for opportunity score and evidence confidence.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} className="relative z-10">
              <div className="p-8 rounded-3xl border border-primary/30 bg-primary/5 h-full flex flex-col items-center text-center shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 ring-4 ring-background">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">3. Ranked Actions</h3>
                <p className="text-primary/80 text-sm leading-relaxed">
                  You receive a calibrated, prioritized pipeline of real opportunities with verifiable evidence and recommended next actions.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 5. CTA ═══ */}
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

const aboutContent = `import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { 
  ArrowRight, Lightbulb, Workflow, Cpu, Box, Database, Search, 
  RefreshCcw, Settings, LineChart, Target, ShieldCheck
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-dot-grid" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(222 47% 6%) 100%)' }}>
        <div className="glow-orb glow-orb-cyan w-[800px] h-[800px] top-0 right-0 opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
                Turning market noise into <br className="hidden md:block" />
                <span className="text-gradient-blue">clear commercial strategy.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                JAS Connect is built around one central thesis: Every business has a different definition of a valuable opportunity. We turn that definition into a repeatable, automated system.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ ARCHITECTURE (19 LAYERS SIMPLIFIED) ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">The JAS Architecture</h2>
            <p className="text-muted-foreground text-lg">A 19-layer intelligence engine, distilled into 6 core operational stages.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "1. Business Understanding", desc: "We map your commercial DNA: Company + Product + Market + Buyer + Commercial Constraints.", icon: Box },
              { title: "2. Candidate Discovery", desc: "JAS creates a universe from relevant sources. Data sources discover evidence, they don't determine qualification.", icon: Search },
              { title: "3. Qualification Gates", desc: "JAS asks: 'Should this opportunity even be considered?' Ineligible entities are eliminated instantly.", icon: ShieldCheck },
              { title: "4. Intelligence & Scoring", desc: "Enrichment + Signal Extraction + Opportunity Score + Evidence Confidence. Computed separately.", icon: Lightbulb },
              { title: "5. Prioritization", desc: "JAS determines what deserves your sales team's attention first, why, and why now.", icon: Target },
              { title: "6. Outcome Learning", desc: "Sales actions produce outcomes (Responded, Qualified, Proposal). The model recalibrates based on reality.", icon: RefreshCcw }
            ].map((layer, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <layer.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{layer.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{layer.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE 72-HOUR PROTOCOL & FLYWHEEL ═══ */}
      <section className="py-24" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Timeline */}
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-8">The 72-Hour Engine Protocol</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {[
                  { hours: "0–24", title: "Commercial Discovery", desc: "Mapping your Product × Market logic, Buyer Archetypes, and Qualification Architecture." },
                  { hours: "24–48", title: "Configuration", desc: "Signal Selection, Weight Research, Calibration, and Engine assembly." },
                  { hours: "48–72", title: "Deployment", desc: "Candidate Discovery, Enrichment, Scoring, QA, and Client Calibration." }
                ].map((step, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                      {i + 1}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Hours {step.hours}</span>
                      </div>
                      <h3 className="font-bold text-lg text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* The Flywheel */}
            <ScrollReveal delay={0.2}>
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 p-10 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full"></div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <RefreshCcw className="w-6 h-6 text-primary" /> The Data Moat Flywheel
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1"><Database className="w-4 h-4 text-primary"/></div>
                    <div>
                      <h4 className="font-bold text-foreground">Industry Engine Templates</h4>
                      <p className="text-sm text-muted-foreground mt-1">We don't invent an industry from scratch for every client. We use shared infrastructure.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1"><Target className="w-4 h-4 text-primary"/></div>
                    <div>
                      <h4 className="font-bold text-foreground">Client Overrides</h4>
                      <p className="text-sm text-muted-foreground mt-1">We apply your unique constraints to the pre-built industry model.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1"><LineChart className="w-4 h-4 text-primary"/></div>
                    <div>
                      <h4 className="font-bold text-foreground">Outcome Data</h4>
                      <p className="text-sm text-muted-foreground mt-1">What JAS recommended vs what actually closed. This recalibrates the entire engine dynamically.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ CURRENT STAGE ═══ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Join the Design Partner Program</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We are currently in a design partner phase, translating our completed architecture into configurable software, validating qualification, scoring and ranking assumptions with real sales-teams, before introducing data-driven automated recalibration.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              Our first production templates are focused on the Indian PEB and structural steel market. If you want to validate your pipeline with mathematical rigor, we'd love to work with you.
            </p>
            <Button size="xl" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,211,238,0.2)]" onClick={() => navigate('/book-demo')}>
              Apply for Early Access <ArrowRight className="w-5 h-5" />
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
