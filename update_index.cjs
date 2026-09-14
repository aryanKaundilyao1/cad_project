const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the services section
const newServices = `      {/* ═══ 4. OUR SERVICES ═══ */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Our Major Services</h2>
            <p className="text-lg text-muted-foreground mt-4">Comprehensive intelligence infrastructure tailored for your business.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={0.1}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Opportunity Intelligence</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ranked, explainable opportunities. We tell you exactly what you need to focus on today.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">CRM & First-Party Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Intelligence applied to your existing data. We revitalize and structure your dormant CRM.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Lead Discovery & Enrichment</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  New prospects + enriched company intelligence perfectly matched to your commercial DNA.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="p-8 rounded-3xl border border-white/10 bg-card h-full hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Sales & Outreach Intelligence</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Who to contact, why now, and how to approach them to maximize your win rate.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>`;

content = content.replace(/\{\/\* ═══ 4\. OUR SERVICES ═══ \*\/\}[\s\S]*?\{\/\* ═══ 5\. OUR UNIQUE SELLING PROPOSITIONS \(USPs\) ═══ \*\/\}/, newServices + '\n\n      {/* ═══ 5. OUR UNIQUE SELLING PROPOSITIONS (USPs) ═══ */}');

// Replace the Competitor section
const newUSPs = `      {/* ═══ 5. OUR UNIQUE SELLING PROPOSITIONS (USPs) ═══ */}
      <section className="py-24" style={{ background: 'hsl(222 47% 5%)' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">JAS vs. Competitors</h2>
            <p className="text-lg text-muted-foreground mt-4">Why the JAS architecture outperforms generic lead databases and AI tools.</p>
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">Up to 80% Reduction in Outreach Time</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Competitors give you massive lists of unfiltered data, forcing your team to waste time qualifying. JAS eliminates garbage instantly using strict Qualification Gates, ensuring you only spend time on winnable deals.
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">85%+ Data Accuracy Guarantee</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Generic databases decay quickly. We separate "Opportunity Score" from "Evidence Confidence", cross-referencing live data streams to guarantee the information your sales team receives is current, verified, and highly accurate.
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">Total Explainability ("Why Now")</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Competitors use black-box AI scores that sales teams don't trust. JAS provides complete transparency. We trace every recommendation back to its exact commercial triggers, giving you the perfect angle to start the conversation.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>`;

content = content.replace(/\{\/\* ═══ 5\. OUR UNIQUE SELLING PROPOSITIONS \(USPs\) ═══ \*\/\}[\s\S]*?\{\/\* ═══ 6\. CTA ═══ \*\/\}/, newUSPs + '\n\n      {/* ═══ 6. CTA ═══ */}');

fs.writeFileSync(filePath, content, 'utf8');
