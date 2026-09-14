import { ArrowRight, Box, Compass, Database, CheckCircle2, LineChart, Lightbulb, Search, ShieldCheck, Target, RefreshCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import React from "react";

const ScrollReveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 border-b border-primary/20 bg-primary/5">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest mb-8">
              About JAS Connect
            </div>
            <h1 className="text-5xl md:text-7xl font-editorial tracking-tight mb-8 leading-[1.1]">
              Organizing fragmented data into <span className="italic text-primary">actionable opportunities.</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-light max-w-3xl mx-auto">
              We turn the noise of global B2B information into precise commercial intelligence.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* JAS vs Competitors Section */}
      <section className="py-24 border-b border-primary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal className="mb-16 md:w-2/3">
            <h2 className="text-4xl md:text-5xl font-editorial tracking-tight mb-6">How JAS Changes the Game</h2>
            <p className="text-xl text-foreground/70 font-light">
              Why we outperform traditional databases and legacy CRMs.
            </p>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-px bg-primary/20 border border-primary/20">
            {/* The Old Way */}
            <ScrollReveal delay={0.1} className="bg-background p-12 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-editorial font-bold text-foreground mb-8 pb-4 border-b border-primary/20">
                The Old Way
              </h3>
              <ul className="space-y-6 text-foreground/70 font-light">
                <li className="flex gap-4">
                  <span className="font-editorial text-xl opacity-50">&mdash;</span> 
                  <span>Massive lists of unfiltered, raw data</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-editorial text-xl opacity-50">&mdash;</span> 
                  <span>Sales teams spend 80% of time qualifying leads</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-editorial text-xl opacity-50">&mdash;</span> 
                  <span>High data decay and stale contact information</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-editorial text-xl opacity-50">&mdash;</span> 
                  <span>Black-box AI that sales teams don't trust or understand</span>
                </li>
              </ul>
            </ScrollReveal>

            {/* The JAS Way */}
            <ScrollReveal delay={0.2} className="bg-primary text-primary-foreground p-12 h-full flex flex-col justify-center relative overflow-hidden">
              <h3 className="text-2xl font-editorial font-bold mb-8 pb-4 border-b border-primary-foreground/20">
                The JAS Way
              </h3>
              <ul className="space-y-6 text-primary-foreground/80 font-light relative z-10">
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground shrink-0" strokeWidth={1.5} />
                  <span>Ranked, explainable opportunities ready for outreach</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground shrink-0" strokeWidth={1.5} />
                  <span>Up to 80% reduction in outreach and research time</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground shrink-0" strokeWidth={1.5} />
                  <span>85%+ Data Accuracy Guarantee via cross-referencing</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground shrink-0" strokeWidth={1.5} />
                  <span>Total explainability: knowing exactly "Why Now"</span>
                </li>
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* The Engine Architecture */}
      <section className="py-24 border-b border-primary/20 bg-primary/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <ScrollReveal className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-editorial tracking-tight mb-6">The Intelligence Engine</h2>
            <p className="text-xl text-foreground/70 font-light">
              A 19-layer intelligence architecture, distilled into 6 core operational stages.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
            {[
              { num: "01", title: "Business Understanding", desc: "We map your commercial DNA: Company + Product + Market + Buyer." },
              { num: "02", title: "Candidate Discovery", desc: "JAS creates a universe from relevant sources. Data sources discover evidence." },
              { num: "03", title: "Qualification Gates", desc: "JAS asks: 'Should this opportunity even be considered?' Garbage is eliminated instantly." },
              { num: "04", title: "Intelligence & Scoring", desc: "Enrichment + Signal Extraction + Opportunity Score + Evidence Confidence." },
              { num: "05", title: "Prioritization", desc: "JAS determines what deserves your sales team's attention first, why, and why now." },
              { num: "06", title: "Outcome Learning", desc: "Sales actions produce outcomes. The model recalibrates based on reality." }
            ].map((layer, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                <div className="flex items-start gap-6 border-t-2 border-primary/20 pt-6">
                  <span className="font-editorial text-4xl text-primary font-bold opacity-30">{layer.num}</span>
                  <div>
                    <h3 className="text-xl font-editorial font-bold text-foreground mb-3">{layer.title}</h3>
                    <p className="text-foreground/70 font-light leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollReveal>
            <h2 className="text-5xl font-editorial mb-8 tracking-tight leading-[1.1]">
              Transform Your <span className="italic text-primary">Sales Pipeline</span>
            </h2>
            <p className="text-xl text-foreground/70 leading-relaxed font-light mb-12">
              Focus your sales team on opportunities that are real, reachable, and winnable. Let JAS do the heavy lifting of qualification and intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="xl" onClick={() => navigate('/book-demo')}>
                Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
