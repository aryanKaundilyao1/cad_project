import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircleQuestion, ArrowRight } from "lucide-react";

export default function FAQ() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        
        {/* ── HERO ── */}
        <section className="relative py-32 md:py-48 overflow-hidden border-b border-primary/20 bg-background">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest mb-10 shadow-[0_4px_12px_rgba(32,60,127,0.05)]">
                <MessageCircleQuestion className="w-4 h-4 text-accent" />
                Help Center
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-editorial tracking-tight mb-8 text-foreground leading-[1.05]">
                Frequently Asked <br className="hidden md:block"/> <span className="italic text-primary">Questions.</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <p className="text-lg md:text-2xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
                Everything you need to know about our intelligence engine, data sourcing, and commercial methodology.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── FAQ ACCORDION ── */}
        <section className="py-32 bg-primary/5 border-b border-primary/20">
          <div className="container mx-auto px-4 max-w-3xl">
            <ScrollReveal>
              <Accordion type="single" collapsible className="w-full space-y-6">
                
                {[
                  {
                    q: "Where does JAS CONNECT source its data?",
                    a: "We source our data from a combination of public government procurement portals, municipal websites, verified API feeds, and direct submissions from buyers within our Marketplace. Every major signal is subjected to our qualification engine to ensure authenticity and relevance."
                  },
                  {
                    q: "How frequently are opportunities updated?",
                    a: "Our intelligence engine continuously monitors our sources. New opportunities are processed, structured, and pushed to the platform daily. Real-time alerts are sent to Premium users when an opportunity perfectly matches their specific capabilities."
                  },
                  {
                    q: "How does the subscription model work?",
                    a: "We offer a Free plan which gives you visibility in our network so buyers can find you. Our Premium plan unlocks the Opportunity Workspace, giving you a monthly quota of verified leads, full CRM integration, and access to our Intelligence dashboards. You can view full details on our Pricing page."
                  },
                  {
                    q: "Are the leads exclusive to me?",
                    a: "We do not enforce exclusivity on public tender opportunities, as that information is inherently public. However, for private requirements posted directly by buyers in the JAS CONNECT network, buyers have the option to limit the number of suppliers who can view and respond to their request to ensure a manageable evaluation process."
                  },
                  {
                    q: "What if an opportunity has incorrect information?",
                    a: "While our qualification engine is highly accurate, discrepancies can occasionally occur, usually stemming from errors in the original source documentation. If you spot an inaccuracy, you can report it directly from the opportunity view, and our auditing team will verify and correct it within 24 hours."
                  }
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border border-primary/15 rounded-3xl px-8 py-4 bg-card shadow-[0_8px_30px_rgba(32,60,127,0.03)] hover:shadow-[0_15px_40px_rgba(32,60,127,0.06)] transition-all duration-300">
                    <AccordionTrigger className="text-xl font-sans font-semibold tracking-tight text-foreground hover:no-underline hover:text-primary transition-colors text-left py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/70 text-lg leading-relaxed pt-2 pb-6 font-light border-t border-primary/5 mt-2">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}

              </Accordion>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 relative overflow-hidden text-center bg-background border-b border-primary/20">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-editorial tracking-tight text-foreground mb-8">
                Still have <span className="italic text-primary">questions?</span>
              </h2>
              <p className="text-xl text-foreground/70 font-light mb-12">
                We're happy to talk through your specific needs and commercial strategy.
              </p>
              <Button size="xl" className="shadow-[0_8px_20px_-6px_rgba(32,60,127,0.3)] hover:shadow-[0_12px_24px_-8px_rgba(32,60,127,0.4)] transition-all duration-300" onClick={() => navigate('/contact')}>
                Contact Support <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </ScrollReveal>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
