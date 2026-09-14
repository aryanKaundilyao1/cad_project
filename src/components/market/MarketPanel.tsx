import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VendorTable } from "./VendorTable";
import { PieChart, AlertCircle, Map, Target, TrendingUp, Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { generateMarketInsights } from "@/utils/marketIntelligence";
import { useMemo } from "react";

interface MarketPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  projectType: string;
  budgetMin: string;
  budgetMax: string;
  totalArea: string;
  isPremium: boolean;
}

export const MarketPanel = ({ 
  open, 
  onOpenChange, 
  location, 
  projectType, 
  budgetMin, 
  budgetMax, 
  totalArea,
  isPremium 
}: MarketPanelProps) => {

  const insights = useMemo(() => {
    if (!isPremium) return null;
    return generateMarketInsights(location, projectType, Number(totalArea) || 10000);
  }, [location, projectType, totalArea, isPremium]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l-white/10">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl font-display text-foreground mt-4">
            <PieChart className="h-6 w-6 text-primary" />
            Market Intelligence
            {isPremium ? (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 ml-2"><Crown className="h-3 w-3" /> Premium</Badge>
            ) : null}
          </SheetTitle>
          <SheetDescription>
            Data-driven insights for {projectType || "your project"} in {location || "your area"}.
          </SheetDescription>
        </SheetHeader>

        {!isPremium ? (
          <div className="flex flex-col items-center justify-center p-8 mt-10 rounded-xl border border-white/10 bg-white/[0.02] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Intelligence Locked</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Upgrade to Premium to unlock real-time cost estimations, verified vendor lists, and area insights before you post your requirement.
            </p>
            <Link to="/pricing">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8 mt-6">
            
            {/* Cost Estimation */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Estimated Project Cost</h3>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-3xl font-bold text-primary mb-1">
                  {insights ? `${formatCurrency(insights.estimatedCostMin)} - ${formatCurrency(insights.estimatedCostMax)}` : "Calculating..."}
                </p>
                <p className="text-xs text-muted-foreground">Based on {totalArea ? `${totalArea} sq ft` : 'current specs'} and {projectType || 'market'} rates in {location || 'your area'}.</p>
                
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {insights?.costBreakdown.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className={`h-1.5 w-full ${item.color} rounded-full opacity-80`} />
                      <span className="text-[10px] text-muted-foreground">{item.label} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Vendor List */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Top Verified Vendors near {location || "you"}</h3>
              </div>
              <VendorTable location={location} projectType={projectType} isPremium={isPremium} />
            </section>

            {/* Insights Panel */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Area Insights</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Avg Timeline</p>
                  <p className="font-medium text-sm text-foreground">{insights?.timelineMinMonths} - {insights?.timelineMaxMonths} Months</p>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Demand Level</p>
                  <p className={`font-medium text-sm ${insights?.demandLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {insights?.demandLevel}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Vendor Density</p>
                  <p className="font-medium text-sm text-foreground">{insights?.vendorDensityText}</p>
                </div>
              </div>
            </section>

            {/* Compliance */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Compliance Checklist</h3>
              </div>
              <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] space-y-2 text-sm text-muted-foreground">
                {insights?.complianceChecklist.map((item, i) => (
                  <p key={i} className="flex items-start gap-2"><span className="text-emerald-500">✓</span> {item}</p>
                ))}
              </div>
            </section>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
