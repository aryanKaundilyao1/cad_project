import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, IndianRupee, TrendingUp, Users, Crown, Star, Zap, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const AdminRevenueTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [revenue, setRevenue] = useState<any>(null);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      // All transactions from unified payments table
      const { data: payments } = await (supabase as any)
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      const allPayments = payments || [];
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate earnings
      const totalEarnings = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const leadRevenue = allPayments
        .filter((p: any) => p.type === 'lead_unlock')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const subRevenue = allPayments
        .filter((p: any) => p.type === 'subscription')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      const todayEarnings = allPayments
        .filter((p: any) => p.created_at?.slice(0, 10) === todayStr)
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const monthEarnings = allPayments
        .filter((p: any) => new Date(p.created_at) >= monthStart)
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const lastMonthEarnings = allPayments
        .filter((p: any) => {
          const d = new Date(p.created_at);
          return d >= lastMonthStart && d <= lastMonthEnd;
        })
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      const totalLeadsSold = allPayments.filter((p: any) => p.type === 'lead_unlock').length;
      const todayLeadsSold = allPayments.filter((p: any) => p.type === 'lead_unlock' && p.created_at?.slice(0, 10) === todayStr).length;

      // Subscription plans
      const { data: profiles } = await supabase
        .from("profiles")
        .select("subscription_plan");

      const plans = (profiles || []).reduce((acc: Record<string, number>, p: any) => {
        const plan = p.subscription_plan || "free";
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Daily breakdown (last 7 days)
      const dailyBreakdown: { date: string; earnings: number; unlocks: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
        const dayPayments = allPayments.filter((p: any) => p.created_at?.slice(0, 10) === dateStr);
        dailyBreakdown.push({
          date: dayLabel,
          earnings: dayPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
          unlocks: dayPayments.filter((p: any) => p.type === 'lead_unlock').length,
        });
      }

      // Monthly breakdown (last 6 months)
      const monthlyBreakdown: { month: string; earnings: number; unlocks: number }[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        const mPayments = allPayments.filter((p: any) => {
          const ud = new Date(p.created_at);
          return ud >= d && ud <= mEnd;
        });
        monthlyBreakdown.push({
          month: label,
          earnings: mPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
          unlocks: mPayments.filter((p: any) => p.type === 'lead_unlock').length,
        });
      }

      setRevenue({
        totalEarnings,
        leadRevenue,
        subRevenue,
        todayEarnings,
        monthEarnings,
        lastMonthEarnings,
        totalLeadsSold,
        todayLeadsSold,
        dailyBreakdown,
        monthlyBreakdown,
        plans,
      });

      setLoaded(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const PLAN_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    free: { icon: Zap, color: "#6B7280", label: "Free" },
    basic: { icon: Star, color: "#3B82F6", label: "Basic" },
    premium: { icon: Crown, color: "#22D3EE", label: "Premium" },
    elite: { icon: Crown, color: "#F59E0B", label: "Elite" },
  };

  if (!loaded) {
    return (
      <Card className="bg-card/40 border-white/5">
        <CardContent className="py-16 text-center">
          <IndianRupee className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-4">Load revenue data to see earnings analytics.</p>
          <Button onClick={loadRevenue} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
            Load Revenue Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const monthGrowth = revenue.lastMonthEarnings > 0
    ? ((revenue.monthEarnings - revenue.lastMonthEarnings) / revenue.lastMonthEarnings * 100).toFixed(0)
    : "—";

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="border-white/10 gap-1.5" onClick={loadRevenue} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
        </Button>
      </div>

      {/* Top-line Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `₹${revenue.todayEarnings.toLocaleString("en-IN")}`, sub: `${revenue.todayLeadsSold} unlocks`, color: "#10B981" },
          { label: "Lead Unlocks", value: `₹${revenue.leadRevenue.toLocaleString("en-IN")}`, sub: `${revenue.totalLeadsSold} total leads`, color: "#3B82F6" },
          { label: "Subscriptions", value: `₹${revenue.subRevenue.toLocaleString("en-IN")}`, sub: `Active growth plans`, color: "#8B5CF6" },
          { label: "Total Revenue", value: `₹${revenue.totalEarnings.toLocaleString("en-IN")}`, sub: monthGrowth !== "—" ? `${Number(monthGrowth) >= 0 ? "+" : ""}${monthGrowth}% vs last month` : "Total earnings", color: "#F59E0B" },
        ].map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="bg-card/40 border-white/5 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.color }} />
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Breakdown */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Daily Earnings (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {revenue.dailyBreakdown.map((day: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <p className="text-[10px] text-muted-foreground mb-1">{day.date}</p>
                <p className="text-lg font-bold text-foreground">₹{day.earnings.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground">{day.unlocks} unlocks</p>
                {/* Mini bar */}
                <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, revenue.dailyBreakdown.length > 0
                        ? (day.earnings / Math.max(1, Math.max(...revenue.dailyBreakdown.map((d: any) => d.earnings)))) * 100
                        : 0)}%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Earnings (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenue.monthlyBreakdown.map((m: any, idx: number) => {
              const maxEarnings = Math.max(1, ...revenue.monthlyBreakdown.map((mm: any) => mm.earnings));
              const pct = (m.earnings / maxEarnings) * 100;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{m.month}</span>
                  <div className="flex-1 h-6 rounded-lg bg-white/[0.04] overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg bg-gradient-to-r from-primary/80 to-primary/40"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-28 text-right">₹{m.earnings.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-muted-foreground w-20 text-right">{m.unlocks} unlocks</span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Plans */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" /> Active Plans Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(revenue.plans).map(([plan, count]: [string, any]) => {
              const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
              const PlanIcon = cfg.icon;
              return (
                <div
                  key={plan}
                  className="p-4 rounded-xl text-center"
                  style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}18` }}
                >
                  <PlanIcon className="h-6 w-6 mx-auto mb-2" style={{ color: cfg.color }} />
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs uppercase mt-1" style={{ color: cfg.color }}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm text-muted-foreground">
              Total active paid subscribers:{" "}
              <span className="font-bold text-foreground">
                {Object.entries(revenue.plans)
                  .filter(([k]) => k !== "free")
                  .reduce((s, [, v]: [string, any]) => s + v, 0)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenueTab;
