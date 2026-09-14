import { ArrowRight, Box, BarChart, FileText, Globe, Layers, ArrowUpRight, Database, Search, Target, ShieldCheck, CheckCircle2, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import React from "react";

// Framer-like animation wrapper with blur and spring-like easing
const ScrollReveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      style={{ willChange: "transform, opacity" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <Navigation />

      {/* ═══ 1. HERO SECTION ═══ */}
      <section id="hero" className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden flex flex-col items-center justify-center text-center border-b border-primary/20">
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <ScrollReveal>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-primary/20 bg-background text-primary text-xs font-semibold uppercase tracking-widest mb-10 shadow-[0_4px_12px_rgba(32,60,127,0.05)]">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Opportunity Intelligence
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-editorial mb-8 text-foreground leading-[1.05] tracking-tight">
              Turn noisy B2B data <br className="hidden md:block" /> into <span className="italic text-primary">clear decisions.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-lg md:text-2xl text-foreground/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              JAS Connect eliminates garbage data instantly, telling your sales team who to contact, why now, and how to win.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Button size="xl" className="shadow-[0_8px_20px_-6px_rgba(32,60,127,0.3)] hover:shadow-[0_12px_24px_-8px_rgba(32,60,127,0.4)] transition-all duration-300" onClick={() => navigate('/book-demo')}>
                Book a Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" className="border-primary/20 hover:bg-primary/5 transition-all duration-300" onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ 2. TRUSTED BY ═══ */}



      {/* ═══ 3. THE PROBLEM ═══ */}
      <section id="problem" className="py-32 border-b border-primary/20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-editorial mb-8 text-foreground leading-tight tracking-tight">
                Sales teams are drowning in a <span className="italic text-accent">sea of irrelevant data.</span>
              </h2>
              <div className="space-y-6 text-xl text-foreground/70 font-light leading-relaxed">
                <p>
                  Most B2B platforms provide quantity over quality—giving you 10,000 "leads" that lack context, timing, or commercial viability.
                </p>
                <p>
                  Your sales team spends 80% of their time researching and qualifying, and only 20% of their time actually selling. This is an architectural failure, not a team failure.
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2} className="relative">
              <div className="border border-primary/20 p-10 bg-card shadow-[0_20px_60px_-15px_rgba(32,60,127,0.1)] rounded-2xl">
                <div className="inline-block px-3 py-1 mb-6 border border-primary/20 text-xs font-semibold uppercase tracking-widest text-primary rounded-full">The Solution</div>
                <h3 className="font-editorial text-3xl mb-6">The JAS Resolution</h3>
                <p className="text-foreground/80 font-light text-xl mb-10 italic">
                  "Here are the 20 opportunities your team should care about today. And here is exactly why."
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-5 items-start pb-6 border-b border-primary/10">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                    <span className="font-light text-lg">Evidence-based qualification replaces guesswork.</span>
                  </li>
                  <li className="flex gap-5 items-start pb-6 border-b border-primary/10">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                    <span className="font-light text-lg">Signals trigger action at the exact moment of commercial need.</span>
                  </li>
                  <li className="flex gap-5 items-start">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                    <span className="font-light text-lg">Explainable scoring builds absolute trust with your sales team.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 4. OUR SERVICES (Bento Grid Style) ═══ */}
      <section id="services" className="py-32 border-b border-primary/20">
        <div className="container mx-auto px-4 max-w-7xl">
          <ScrollReveal className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-editorial text-foreground leading-tight mb-6">
              Intelligence <span className="italic text-primary">Infrastructure</span>
            </h2>
            <p className="text-xl text-foreground/70 font-light">
              Comprehensive tools tailored to your exact commercial DNA.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal delay={0.1} className="h-full">
              <div className="h-full p-10 flex flex-col bg-card border border-primary/15 rounded-2xl hover:shadow-[0_20px_40px_-10px_rgba(32,60,127,0.08)] transition-all duration-500 group">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Database className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-editorial font-bold text-foreground mb-4">Opportunity Intelligence</h3>
                <p className="text-foreground/70 text-lg leading-relaxed font-light">
                  Ranked, explainable opportunities. We tell you exactly what you need to focus on today, eliminating the guesswork from your pipeline.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className="h-full">
              <div className="h-full p-10 flex flex-col bg-card border border-primary/15 rounded-2xl hover:shadow-[0_20px_40px_-10px_rgba(32,60,127,0.08)] transition-all duration-500 group">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Layers className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-editorial font-bold text-foreground mb-4">CRM & First-Party Data</h3>
                <p className="text-foreground/70 text-lg leading-relaxed font-light">
                  Intelligence applied to your existing data. We revitalize and structure your dormant CRM, turning cold records into active signals.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} className="h-full">
              <div className="h-full p-10 flex flex-col bg-card border border-primary/15 rounded-2xl hover:shadow-[0_20px_40px_-10px_rgba(32,60,127,0.08)] transition-all duration-500 group">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Search className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-editorial font-bold text-foreground mb-4">Lead Discovery & Enrichment</h3>
                <p className="text-foreground/70 text-lg leading-relaxed font-light">
                  New prospects and enriched company intelligence perfectly matched to your commercial DNA and target markets.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4} className="h-full">
              <div className="h-full p-10 flex flex-col bg-card border border-primary/15 rounded-2xl hover:shadow-[0_20px_40px_-10px_rgba(32,60,127,0.08)] transition-all duration-500 group">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Target className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-editorial font-bold text-foreground mb-4">Sales & Outreach Intelligence</h3>
                <p className="text-foreground/70 text-lg leading-relaxed font-light">
                  Who to contact, why now, and how to approach them to maximize your win rate and compress your sales cycle.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 5. JAS VS COMPETITORS (USPs) ═══ */}
      <section id="why-jas" className="py-32 border-b border-primary/20 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 sticky top-32">
              <ScrollReveal>
                <h2 className="text-5xl md:text-6xl font-editorial tracking-tight mb-8 leading-[1.1]">
                  JAS vs. <br/> <span className="italic text-primary/70">Competitors</span>
                </h2>
                <p className="text-xl text-foreground/70 font-light leading-relaxed mb-10">
                  Why our architecture consistently outperforms generic lead databases and black-box AI wrappers.
                </p>
                <Button size="xl" className="shadow-[0_8px_20px_-6px_rgba(32,60,127,0.3)] hover:shadow-[0_12px_24px_-8px_rgba(32,60,127,0.4)] transition-all duration-300" onClick={() => navigate('/about')}>
                  Read our full methodology
                </Button>
              </ScrollReveal>
            </div>
            
            <div className="lg:col-span-7">
              <div className="flex flex-col gap-6">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Up to 80% Reduction in Outreach Time",
                    desc: "Competitors provide massive lists of unfiltered data. JAS eliminates garbage instantly using strict Qualification Gates, ensuring you only spend time on winnable deals."
                  },
                  {
                    icon: CheckCircle2,
                    title: "85%+ Data Accuracy Guarantee",
                    desc: "Generic databases decay quickly. We separate 'Opportunity Score' from 'Evidence Confidence', cross-referencing live data streams so your intelligence is always verified."
                  },
                  {
                    icon: Compass,
                    title: "Total Explainability ('Why Now')",
                    desc: "Competitors use black-box AI scores that sales teams don't trust. JAS provides complete transparency, tracing every recommendation back to its exact commercial triggers."
                  }
                ].map((usp, i) => (
                  <ScrollReveal key={i} delay={i * 0.15}>
                    <div className="group bg-card border border-primary/10 rounded-[2rem] p-8 md:p-10 hover:shadow-[0_20px_60px_-15px_rgba(32,60,127,0.1)] hover:border-primary/20 transition-all duration-500">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="shrink-0 w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                          <usp.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="text-xl font-sans font-semibold tracking-tight text-foreground mb-3">{usp.title}</h3>
                          <p className="text-foreground/70 leading-relaxed font-light text-lg">
                            {usp.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. CTA ═══ */}
      <section id="demo" className="py-40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollReveal>
            <h2 className="text-6xl md:text-8xl font-editorial mb-8 text-foreground leading-[1.05] tracking-tight">
              Ready to stop <span className="italic text-primary">searching?</span>
            </h2>
            <p className="text-2xl text-foreground/70 mb-12 font-light">
              Focus your sales team on opportunities that are real, reachable, and winnable.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Button size="xl" className="shadow-[0_8px_20px_-6px_rgba(32,60,127,0.3)] hover:shadow-[0_12px_24px_-8px_rgba(32,60,127,0.4)] transition-all duration-300" onClick={() => navigate('/book-demo')}>
                Book a Demo <ArrowRight className="ml-2 h-5 w-5" />
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
