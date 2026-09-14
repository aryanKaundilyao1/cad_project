import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { 
  Rocket, 
  Users, 
  PenTool, 
  Settings, 
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GrowthServices() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        
        {/* ── HERO ── */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(170deg, hsl(222 47% 4%) 0%, hsl(222 47% 6%) 40%, hsl(222 40% 8%) 100%)' }}>
          
          

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  <Rocket className="w-8 h-8 text-cyan-400" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-foreground">
                  Growth <span className="text-primary italic-cyan">Services</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                  Because Intelligence requires Execution. We don't just hand you a map of opportunities; we give you the engine, the fuel, and the driver to reach them.
                </p>
                <div className="flex justify-center">
                  <Link to="/contact">
                    <Button size="xl" variant="hero" className="gap-2" style={{ background: 'linear-gradient(135deg, #22D3EE, #0ea5e9)', color: '#0A0E1A' }}>
                      Talk to our Growth Team <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── WHY EXECUTION MATTERS ── */}
        <section className="py-24 border-y border-white/5 bg-background">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Why Intelligence needs Execution</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Knowing who needs your product is only half the battle. Reaching out to them effectively, tracking the engagement, and maintaining the relationship until the deal closes is where most companies struggle. Our Growth Services division bridges the gap between knowing and closing.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="py-24 md:py-32" style={{ background: 'hsl(222 47% 6%)' }}>
          <div className="container mx-auto px-4">
            <div className="space-y-12 max-w-6xl mx-auto">
              
              {/* Lead Gen & SDR */}
              <ScrollReveal>
                <div className="flow-node p-8 md:p-12 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-10 items-center">
                  <div className="w-20 h-20 shrink-0 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">Lead Generation & SDR Support</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                      Don't have an internal sales team? Let us be yours.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Dedicated Sales Development Representatives (SDRs)</li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Outbound email and cold calling campaigns</li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Qualification and appointment setting</li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* Brand & Content */}
              <ScrollReveal delay={0.1}>
                <div className="flow-node p-8 md:p-12 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-10 items-center md:flex-row-reverse">
                  <div className="w-20 h-20 shrink-0 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <PenTool className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="md:text-right w-full">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Brand & Content Strategy</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                      When buyers research you, what do they see?
                    </p>
                    <ul className="space-y-2 text-muted-foreground flex flex-col md:items-end">
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-400 md:order-2" /> <span className="md:order-1">Technical whitepapers and case studies</span></li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-400 md:order-2" /> <span className="md:order-1">Website revamps and SEO optimization</span></li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-400 md:order-2" /> <span className="md:order-1">B2B social media authority building</span></li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* CRM & Automation */}
              <ScrollReveal delay={0.2}>
                <div className="flow-node p-8 md:p-12 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-10 items-center">
                  <div className="w-20 h-20 shrink-0 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Settings className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">CRM Setup & Automation</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                      Stop letting leads fall through the cracks of messy spreadsheets.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" /> Custom CRM implementation and migration</li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" /> Automated follow-up sequences</li>
                      <li className="flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" /> Pipeline analytics and reporting dashboards</li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 relative overflow-hidden text-center bg-background border-t border-white/5">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal>
              <TrendingUp className="w-12 h-12 mx-auto text-primary mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Ready to accelerate your pipeline?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Growth Services are custom-tailored to your business size, industry, and goals. Reach out to discuss how we can execute on your behalf.
              </p>
              <Link to="/contact">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8">
                  Request a Consultation
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
