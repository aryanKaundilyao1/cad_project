const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/workspace/WorkspaceScoringEngine.tsx');

const content = `import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, ShieldCheck, Zap, Activity, Building2, Search, SlidersHorizontal, ArrowRight, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function WorkspaceScoringEngine() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Mock states for the sliders/toggles
  const [weights, setWeights] = useState({
    intent: 35,
    fit: 40,
    timing: 25
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Engine Architecture Updated",
        description: "Jumbl proprietary scoring weights have been deployed to the pipeline.",
      });
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-primary/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Active Client Workspace
          </div>
          <h1 className="text-4xl md:text-5xl font-editorial tracking-tight text-foreground flex items-center gap-4">
            Jumbl <span className="text-primary italic">Scoring Engine</span>
          </h1>
          <p className="text-foreground/70 text-lg mt-3 font-light max-w-2xl">
            Configure the proprietary qualification gates and signal weights to determine how incoming opportunities are ranked for Jumbl's sales team.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5">
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full gap-2 shadow-[0_4px_12px_rgba(32,60,127,0.15)] hover:shadow-[0_8px_20px_rgba(32,60,127,0.25)] transition-all">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Deploy Architecture
          </Button>
        </div>
      </div>

      {/* ── MACRO WEIGHTS ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-card border-primary/10 shadow-[0_8px_30px_rgba(32,60,127,0.03)] rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/20"></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-sans tracking-tight">
              <span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" /> Firmographic Fit</span>
              <span className="text-2xl font-editorial font-bold text-primary">{weights.fit}%</span>
            </CardTitle>
            <CardDescription className="text-foreground/60 text-sm">
              Baseline matching criteria (revenue, headcount, industry alignment).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input 
              type="range" 
              className="w-full accent-accent" 
              min="0" max="100" 
              value={weights.fit}
              onChange={(e) => setWeights({...weights, fit: parseInt(e.target.value)})}
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/10 shadow-[0_8px_30px_rgba(32,60,127,0.03)] rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/20"></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-sans tracking-tight">
              <span className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Behavioral Intent</span>
              <span className="text-2xl font-editorial font-bold text-primary">{weights.intent}%</span>
            </CardTitle>
            <CardDescription className="text-foreground/60 text-sm">
              Active buying signals (site visits, content downloads, G2 reviews).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input 
              type="range" 
              className="w-full accent-primary" 
              min="0" max="100" 
              value={weights.intent}
              onChange={(e) => setWeights({...weights, intent: parseInt(e.target.value)})}
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/10 shadow-[0_8px_30px_rgba(32,60,127,0.03)] rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-500/20"></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-sans tracking-tight">
              <span className="flex items-center gap-2"><Zap className="h-5 w-5 text-blue-500" /> Commercial Timing</span>
              <span className="text-2xl font-editorial font-bold text-primary">{weights.timing}%</span>
            </CardTitle>
            <CardDescription className="text-foreground/60 text-sm">
              Trigger events (recent funding, leadership changes, hiring surges).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input 
              type="range" 
              className="w-full accent-blue-500" 
              min="0" max="100" 
              value={weights.timing}
              onChange={(e) => setWeights({...weights, timing: parseInt(e.target.value)})}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── DETAILED GATES ── */}
      <h2 className="text-3xl font-editorial font-bold mt-12 mb-6 text-foreground">Qualification Gates</h2>
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Fit Rules */}
        <Card className="bg-card border-primary/10 rounded-3xl shadow-[0_8px_30px_rgba(32,60,127,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg font-sans">Jumbl Ideal Customer Profile (ICP)</CardTitle>
            <CardDescription>Rules applied to the Firmographic score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Target Industries</p>
                <p className="text-xs text-foreground/60">SaaS, FinTech, E-Commerce</p>
              </div>
              <span className="text-sm font-bold text-accent">+25 pts</span>
            </div>
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Employee Count</p>
                <p className="text-xs text-foreground/60">250 - 1000 employees</p>
              </div>
              <span className="text-sm font-bold text-accent">+15 pts</span>
            </div>
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between opacity-60">
              <div>
                <p className="font-semibold text-sm">Legacy Tech Stack</p>
                <p className="text-xs text-foreground/60">Using deprecated competitors</p>
              </div>
              <span className="text-sm font-bold text-primary">0 pts</span>
            </div>
            <Button variant="ghost" className="w-full mt-2 text-primary font-semibold text-sm hover:bg-primary/5 rounded-full">
              + Add ICP Rule
            </Button>
          </CardContent>
        </Card>

        {/* Intent Rules */}
        <Card className="bg-card border-primary/10 rounded-3xl shadow-[0_8px_30px_rgba(32,60,127,0.02)]">
          <CardHeader>
            <CardTitle className="text-lg font-sans">Intent & Timing Triggers</CardTitle>
            <CardDescription>Rules applied to Behavioral and Timing scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">High-Value Page Visit</p>
                <p className="text-xs text-foreground/60">Viewed Pricing or Enterprise pages</p>
              </div>
              <span className="text-sm font-bold text-primary">+20 pts</span>
            </div>
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Recent Series B/C Funding</p>
                <p className="text-xs text-foreground/60">Within the last 30 days</p>
              </div>
              <span className="text-sm font-bold text-blue-500">+35 pts</span>
            </div>
            <div className="p-4 rounded-2xl bg-background border border-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Key Executive Hire</p>
                <p className="text-xs text-foreground/60">New VP of Operations / Supply Chain</p>
              </div>
              <span className="text-sm font-bold text-blue-500">+15 pts</span>
            </div>
            <Button variant="ghost" className="w-full mt-2 text-primary font-semibold text-sm hover:bg-primary/5 rounded-full">
              + Add Trigger Rule
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* ── THRESHOLDS ── */}
      <Card className="mt-8 border-primary/15 bg-primary text-primary-foreground rounded-3xl overflow-hidden relative shadow-[0_15px_40px_-10px_rgba(32,60,127,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <CardHeader className="relative z-10 pb-6 border-b border-primary-foreground/10">
          <CardTitle className="text-2xl font-editorial">Pipeline Routing Thresholds</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Determine what happens when a lead reaches specific point totals based on Jumbl's capacity.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 pt-8 space-y-8">
           
           <div className="flex flex-col md:flex-row gap-6 items-center">
             <div className="w-24 h-24 rounded-full border-4 border-accent flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(209,96,61,0.3)]">
               <span className="text-2xl font-editorial font-bold">85+</span>
             </div>
             <div>
               <h4 className="text-xl font-sans font-semibold mb-1">Direct to Enterprise AE</h4>
               <p className="text-primary-foreground/70 text-sm font-light leading-relaxed">
                 High priority. Immediately bypasses SDR qualification and routes directly to an Account Executive. Slack alerts triggered to the Jumbl #sales-hot channel.
               </p>
             </div>
           </div>

           <div className="flex flex-col md:flex-row gap-6 items-center opacity-80">
             <div className="w-24 h-24 rounded-full border-4 border-primary-foreground/30 flex items-center justify-center shrink-0">
               <span className="text-2xl font-editorial font-bold text-primary-foreground">50-84</span>
             </div>
             <div>
               <h4 className="text-xl font-sans font-semibold mb-1">SDR Review Queue</h4>
               <p className="text-primary-foreground/70 text-sm font-light leading-relaxed">
                 Standard priority. Added to the daily calling list for SDRs to verify interest before booking a discovery call.
               </p>
             </div>
           </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
`;

fs.writeFileSync(filePath, content, 'utf8');
