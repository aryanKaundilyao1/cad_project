import React from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { ShieldCheck, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const WorkspaceOverview = () => {
  const { company, activeClient } = useWorkspace();
  const clientName = activeClient?.name || company?.name || 'Jumbl';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-7xl mx-auto pb-12 p-8"
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-primary/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            {activeClient?.status || 'Active Client Workspace'}
          </div>
          <h1 className="text-4xl md:text-5xl font-editorial tracking-tight text-foreground flex items-center gap-4">
            {clientName} <span className="text-primary italic">Intelligence OS</span>
          </h1>
          <p className="text-foreground/70 text-lg mt-3 font-light max-w-2xl">
            What should we do today? Here are your top priorities across all commercial intelligence streams.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/workspace/catalogue">
            <Button variant="outline" className="border-primary/20">Manage Products</Button>
          </Link>
          <Link to="/workspace/opportunities">
            <Button className="bg-primary text-white">View Intelligence</Button>
          </Link>
        </div>
      </div>

      {/* ── TODAY'S PRIORITIES ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-primary/10 shadow-[0_8px_30px_rgba(32,60,127,0.03)] rounded-3xl overflow-hidden relative">
          <CardHeader className="pb-4 border-b border-primary/5">
            <CardTitle className="text-2xl font-editorial">Today's Priorities</CardTitle>
            <CardDescription className="text-foreground/60 text-sm">
              Actionable intelligence ranked by the JAS scoring engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-16 text-center h-[300px]">
             <Zap className="w-10 h-10 text-primary/20 mb-4" />
             <h3 className="text-lg font-semibold font-editorial">No opportunities scored yet</h3>
             <p className="text-sm text-foreground/60 mt-2 max-w-sm">
               Opportunity Intelligence will appear here after leads are imported, qualified, and scored against your products.
             </p>
             <Link to="/workspace/catalogue/new">
               <Button variant="outline" className="mt-6 border-primary/20">Add Product / Service</Button>
             </Link>
          </CardContent>
        </Card>

        {/* ── HIGH LEVEL METRICS ── */}
        <div className="space-y-6">
          <Card className="bg-card border-primary/10 rounded-3xl shadow-[0_8px_30px_rgba(32,60,127,0.02)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4" /> Raw Lead Universe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-editorial font-bold text-foreground">0</div>
              <p className="text-xs text-foreground/60 mt-1">Total leads ingested</p>
              <Progress value={0} className="h-1 mt-4 bg-primary/10" indicatorClassName="bg-primary" />
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/10 rounded-3xl shadow-[0_8px_30px_rgba(32,60,127,0.02)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> ICP Qualified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-editorial font-bold text-primary">0</div>
              <p className="text-xs text-foreground/60 mt-1">Passed hard eligibility gates</p>
              <Progress value={0} className="h-1 mt-4 bg-primary/10" indicatorClassName="bg-primary" />
            </CardContent>
          </Card>
          
          <Card className="bg-card border-accent/20 rounded-3xl shadow-[0_8px_30px_rgba(209,96,61,0.05)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-accent flex items-center gap-2">
                <Zap className="w-4 h-4" /> CRM Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-editorial font-bold text-accent">0</div>
              <p className="text-xs text-accent/70 mt-1">Active deals in pipeline</p>
              <Progress value={0} className="h-1 mt-4 bg-accent/20" indicatorClassName="bg-accent" />
            </CardContent>
          </Card>
        </div>
      </div>

    </motion.div>
  );
};

export default WorkspaceOverview;
