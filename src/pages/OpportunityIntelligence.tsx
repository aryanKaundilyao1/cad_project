import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { 
  Search, 
  Database, 
  Network, 
  Activity, 
  ShieldCheck, 
  CheckCircle2,
  BrainCircuit,
  Filter
} from "lucide-react";

export default function OpportunityIntelligence() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        
        {/* ── HERO ── */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(170deg, hsl(222 47% 4%) 0%, hsl(222 47% 6%) 40%, hsl(222 40% 8%) 100%)' }}>
          
          

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <p className="text-sm font-semibold tracking-widest uppercase mb-6 text-primary text-glow">The Core Engine</p>
                <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-foreground">
                  Opportunity <br /> Intelligence
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                  Data is raw and unstructured. Intelligence is qualified, verified, and actionable. We don't just aggregate data; we structure it so you can close deals.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── WHAT IS IT? ── */}
        <section className="py-24" style={{ background: 'hsl(222 47% 6%)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <ScrollReveal>
                <h2 className="section-heading text-left mb-6">What is Opportunity Intelligence?</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Every day, thousands of public and private sector projects are announced. New manufacturing facilities are planned, infrastructure tenders are released, and supply chain expansions are approved.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Opportunity Intelligence is the process of tracking these signals, extracting the specific requirements (e.g., material grades, tolerances, deadlines), and delivering them directly to the manufacturers and suppliers equipped to fulfill them.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className="flow-node p-8 border border-white/10 bg-background/50 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="mt-1"><ShieldCheck className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h4 className="font-bold text-foreground">Verified Signals</h4>
                        <p className="text-sm text-muted-foreground">Only actionable project announcements.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="mt-1"><Filter className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h4 className="font-bold text-foreground">Structured Requirements</h4>
                        <p className="text-sm text-muted-foreground">Extracted technical specifications.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="mt-1"><Activity className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h4 className="font-bold text-foreground">Direct Alignment</h4>
                        <p className="text-sm text-muted-foreground">Matched to your specific capabilities.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── HOW WE SOURCE & STRUCTURE ── */}
        <section className="py-24 md:py-32" style={{ background: 'hsl(222 47% 4%)' }}>
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-16">
              <h2 className="section-heading max-w-3xl mx-auto">The Intelligence Pipeline</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
                How we turn noise into qualified opportunities.
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
              
              {/* Sourcing */}
              <ScrollReveal>
                <div className="flow-node card-hover p-10 h-full border border-white/5 bg-white/[0.02]">
                  <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center bg-blue-500/10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <Database className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">1. How We Source</h3>
                  <ul className="space-y-4 text-muted-foreground leading-relaxed">
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Public Portals:</strong> Continuous monitoring of government and municipal procurement systems.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>API Feeds:</strong> Direct integrations with industry databases and project registries.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Human Verification:</strong> Every major signal is audited to ensure it represents a real, funded initiative.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              {/* Structuring */}
              <ScrollReveal delay={0.2}>
                <div className="flow-node card-hover p-10 h-full border border-white/5 bg-white/[0.02]">
                  <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center bg-accent/10 text-accent shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                    <Network className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">2. How We Structure</h3>
                  <ul className="space-y-4 text-muted-foreground leading-relaxed">
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Entity Resolution:</strong> Identifying exactly which organizations are involved (buyer, contractor, consultant).</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Requirement Extraction:</strong> Parsing 100-page tender documents into specific bullet points of what is needed.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Timeline Mapping:</strong> Identifying submission deadlines, award dates, and project kickoffs.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* ── THE SCORING ENGINE ── */}
        <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: 'hsl(222 47% 6%)' }}>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <div className="w-20 h-20 rounded-3xl mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                  <BrainCircuit className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="section-heading mb-6">Qualification Engine</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                  Not all opportunities are created equal. Our proprietary scoring system evaluates every structured opportunity based on the probability of a successful engagement.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="p-6 rounded-xl bg-background/50 border border-white/5">
                    <h4 className="font-bold text-foreground mb-2 text-xl">High Intent</h4>
                    <p className="text-sm text-muted-foreground">Opportunities with approved budgets, tight deadlines, and explicit public documentation.</p>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 border border-white/5">
                    <h4 className="font-bold text-foreground mb-2 text-xl">Perfect Fit</h4>
                    <p className="text-sm text-muted-foreground">Opportunities where the exact technical requirements match your documented capabilities perfectly.</p>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 border border-white/5">
                    <h4 className="font-bold text-foreground mb-2 text-xl">Timing</h4>
                    <p className="text-sm text-muted-foreground">Engagements where the procurement window aligns with your sales and manufacturing cycles.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
