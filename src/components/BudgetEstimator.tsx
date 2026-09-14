import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DEFAULT_RATES: Record<1 | 2 | 3, number> = {
  1: 1800,
  2: 1500,
  3: 1200,
};

const TYPE_MULTIPLIERS: Record<string, number> = {
  "L1": 1.0,
  "fitout": 1.3,
  "procurement": 0.6,
};

const BREAKDOWN_WEIGHTS = {
  "Structure & Fabrication": 0.38,
  "Roofing & Cladding": 0.18,
  "Foundation & Civil": 0.20,
  "Electrical & MEP": 0.12,
  "Finishing & Misc": 0.12,
};

interface EstimatorProps {
  location: string;
  totalArea: string;
  leadType: string;
  craneRequired: boolean;
  mezzanine: boolean;
  insulation: boolean;
  fireCompliance: string | null;
  budgetMin: string;
  budgetMax: string;
  isPremium: boolean;
}

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const BudgetEstimator = ({
  location, totalArea, leadType,
  craneRequired, mezzanine, insulation, fireCompliance,
  budgetMin, budgetMax, isPremium
}: EstimatorProps) => {
  const navigate = useNavigate();
  const [cityRates, setCityRates] = useState<{ city_name: string; tier: number; base_rate_per_sqft: number }[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("city_rates")
      .select("city_name, tier, base_rate_per_sqft")
      .then(({ data }: { data: any[] | null }) => {
        if (data) setCityRates(data);
      });
  }, []);

  const getBaseRate = (loc: string): { rate: number; tier: 1 | 2 | 3 } => {
    const lower = loc.toLowerCase();
    const match = cityRates.find(r => lower.includes(r.city_name));
    if (match) {
      const tier = match.tier as 1 | 2 | 3;
      return { rate: match.base_rate_per_sqft, tier };
    }
    return { rate: DEFAULT_RATES[3], tier: 3 };
  };

  const estimate = useMemo(() => {
    const area = parseFloat(totalArea);
    if (!area || area <= 0 || !location) return null;

    const { rate: baseRate, tier } = getBaseRate(location);
    const typeMultiplier = TYPE_MULTIPLIERS[leadType] ?? 1.0;

    let addOn = 1.0;
    if (craneRequired) addOn += 0.08;
    if (mezzanine) addOn += 0.12;
    if (insulation) addOn += 0.05;
    if (fireCompliance === "yes") addOn += 0.04;

    const baseTotal = area * baseRate * typeMultiplier * addOn;
    const low = Math.round(baseTotal * 0.85);
    const high = Math.round(baseTotal * 1.15);

    const breakdown = Object.entries(BREAKDOWN_WEIGHTS).map(([label, weight]) => ({
      label,
      low: Math.round(low * weight),
      high: Math.round(high * weight),
    }));

    const userMin = parseFloat(budgetMin);
    const userMax = parseFloat(budgetMax);
    let budgetStatus: "ok" | "low" | "high" | "unknown" = "unknown";
    if (userMin && userMax) {
      const userMid = (userMin + userMax) / 2;
      if (userMid < low * 0.85) budgetStatus = "low";
      else if (userMid > high * 1.2) budgetStatus = "high";
      else budgetStatus = "ok";
    }

    return { low, high, breakdown, budgetStatus, tier };
  }, [location, totalArea, leadType, craneRequired, mezzanine, insulation, fireCompliance, budgetMin, budgetMax, cityRates]);

  if (!isPremium) {
    return (
      <Card className="border-2 border-dashed border-amber-300 bg-amber-50/40">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="text-lg">Smart Budget Estimator</CardTitle>
          <CardDescription>
            Get an AI-powered cost breakdown based on real PEB industry rates. Avoid overpaying.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            This feature is available on the <strong>Premium</strong> and <strong>Elite</strong> client plans.
          </p>
          <Button size="sm" onClick={() => navigate("/pricing")} className="gap-2">
            <TrendingUp className="h-4 w-4" /> Upgrade to Unlock
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return (
      <Card className="border border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          Fill in <strong>Location</strong> and <strong>Total Area</strong> above to see your budget estimate.
        </CardContent>
      </Card>
    );
  }

  const tierLabel = estimate.tier === 1 ? "Tier 1 City" : estimate.tier === 2 ? "Tier 2 City" : "Tier 3 City";

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Smart Budget Estimator
          </CardTitle>
          <Badge variant="secondary">{tierLabel}</Badge>
        </div>
        <CardDescription>Based on live PEB industry rates for your project specs</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="bg-white rounded-lg p-4 text-center border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated Project Cost</p>
          <p className="text-2xl font-bold text-primary">
            {formatINR(estimate.low)} – {formatINR(estimate.high)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">±15% based on market conditions</p>
        </div>

        {estimate.budgetStatus !== "unknown" && (
          <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${estimate.budgetStatus === "ok"
              ? "bg-green-50 border border-green-200 text-green-800"
              : estimate.budgetStatus === "low"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-yellow-50 border border-yellow-200 text-yellow-800"
            }`}>
            {estimate.budgetStatus === "ok"
              ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
            <p>
              {estimate.budgetStatus === "ok" && "Your budget aligns well with market rates for this project."}
              {estimate.budgetStatus === "low" && "Your budget appears lower than market rates. You may receive fewer quality bids — consider revising upward."}
              {estimate.budgetStatus === "high" && "Your budget is above market rates. You have good room to negotiate with vendors."}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cost Breakdown</p>
          <div className="space-y-2">
            {estimate.breakdown.map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">
                  {formatINR(item.low)} – {formatINR(item.high)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3">
          * Estimates are indicative and based on industry averages. Actual costs may vary based on vendor quotes, site conditions, and specifications.
        </p>
      </CardContent>
    </Card>
  );
};

export default BudgetEstimator;