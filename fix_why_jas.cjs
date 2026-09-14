const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We are completely replacing the 'JAS VS COMPETITORS' section.
const regex = /\{\/\* ═══ 5\. JAS VS COMPETITORS \(USPs\) ═══ \*\/\}[\s\S]*?\{\/\* ═══ 6\. CTA ═══ \*\/\}/;

const newSection = `{/* ═══ 5. JAS VS COMPETITORS (USPs) ═══ */}
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

      {/* ═══ 6. CTA ═══ */}`;

content = content.replace(regex, newSection);

fs.writeFileSync(filePath, content, 'utf8');
