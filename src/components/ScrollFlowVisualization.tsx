import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, ShieldCheck, Users, Database, LayoutDashboard } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const stages = [
  {
    icon: Search,
    title: "Lead Discovery",
    description: "Search across millions of business contacts and companies. Filter by industry, location, company size, and more.",
    subPoints: ["Industry-wide search", "Smart filters", "Real-time results"],
    accent: "#8B5CF6",
    glow: "rgba(139, 92, 246, 0.15)",
  },
  {
    icon: Sparkles,
    title: "AI Enrichment",
    description: "Automatically enrich leads with verified contact details, company data, and intent signals.",
    accent: "#3B82F6",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  {
    icon: ShieldCheck,
    title: "Data Verification",
    description: "Every lead is validated for accuracy — verified emails, phone numbers, and company details.",
    subPoints: ["Email verification", "Phone validation", "Company data check"],
    accent: "#60A5FA",
    glow: "rgba(96, 165, 250, 0.15)",
  },
  {
    icon: Users,
    title: "Smart Prospect Matching",
    description: "AI matches your ideal customer profile with the right prospects — no more cold guesswork.",
    accent: "#22D3EE",
    glow: "rgba(34, 211, 238, 0.15)",
  },
  {
    icon: Database,
    title: "CRM Pipeline",
    description: "Qualified leads flow directly into your CRM pipeline for tracking, follow-ups, and conversion.",
    subPoints: ["Verified lead delivery", "Auto-enriched profiles", "Activity tracking"],
    accent: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    icon: LayoutDashboard,
    title: "Deal Tracking & Automation",
    description: "Manage your sales pipeline, automate follow-ups, and track deal progress from first touch to close.",
    subPoints: ["Pipeline management", "Automated sequences", "Revenue tracking"],
    accent: "#10B981",
    glow: "rgba(16, 185, 129, 0.15)",
  },
];

const ScrollFlowVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Progress line height (0% to 100% as user scrolls through)
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16 md:mb-24">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 text-glow">How It Works</p>
          <h2 className="section-heading max-w-3xl mx-auto">
            From Discovery to Deal
          </h2>
          <p className="section-subheading mx-auto mt-4">
            Every lead flows through an intelligent pipeline — from AI discovery to verified conversion.
          </p>
        </ScrollReveal>

        {/* Desktop: vertical timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Animated progress line */}
          <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="w-full glow-line rounded-full"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-8 md:space-y-12">
            {stages.map((stage, index) => (
              <ScrollReveal
                key={index}
                delay={index * 0.1}
                className="relative"
              >
                <div className="flex gap-6 md:gap-10 items-start">
                  {/* Node dot */}
                  <div className="hidden md:flex relative z-10 shrink-0">
                    <motion.div
                      className="w-16 h-16 rounded-2xl border flex items-center justify-center flow-node-icon transition-all duration-500"
                      style={{
                        borderColor: `${stage.accent}33`,
                        boxShadow: `0 0 20px ${stage.glow}`,
                        background: `${stage.accent}08`,
                      }}
                      whileInView={{
                        borderColor: `${stage.accent}66`,
                        boxShadow: `0 0 40px ${stage.glow}, 0 0 80px ${stage.accent}08`,
                      }}
                      viewport={{ once: true, margin: "-100px" }}
                    >
                      <stage.icon
                        className="h-6 w-6"
                        style={{ color: stage.accent, filter: `drop-shadow(0 0 6px ${stage.accent})` }}
                      />
                    </motion.div>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 flow-node group hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Mobile icon */}
                      <div
                        className="md:hidden w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                        style={{ borderColor: `${stage.accent}33`, background: `${stage.accent}08` }}
                      >
                        <stage.icon className="h-5 w-5" style={{ color: stage.accent }} />
                      </div>
                      <div>
                        <span className="text-xs font-mono block mb-1" style={{ color: `${stage.accent}99` }}>
                          STEP {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-lg font-bold text-foreground">{stage.title}</h3>
                      </div>
                    </div>
                    <div className="md:pl-0 pl-[52px]">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {stage.description}
                      </p>
                      
                      {stage.subPoints && (
                        <ul className="mt-4 space-y-2">
                          {stage.subPoints.map((point, i) => (
                            <li key={i} className="flex items-center text-xs text-muted-foreground/80">
                              <span className="w-1.5 h-1.5 rounded-full mr-2 shrink-0" style={{ background: stage.accent }} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollFlowVisualization;
