import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OpportunityAnalyticsService } from "@/services/intelligence/analytics/OpportunityAnalyticsService";
import { Loader2, Activity, TrendingUp, TrendingDown, Target, Zap, Clock, Users } from "lucide-react";

const AdminAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [topOpps, setTopOpps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, t] = await Promise.all([
        OpportunityAnalyticsService.getDashboardMetrics(),
        OpportunityAnalyticsService.getTopOpportunities(10)
      ]);
      setMetrics(m);
      setTopOpps(t);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-purple-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            Intelligence Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Executive overview of all scoring metrics across the database.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2"><Target className="h-4 w-4"/> Avg Master Score</div>
              <div className="text-4xl font-bold">{metrics?.avgOpportunity || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-emerald-600 mb-2"><Activity className="h-4 w-4"/> Avg Fit</div>
              <div className="text-3xl font-bold">{metrics?.avgFit || 0}<span className="text-sm text-gray-400 font-normal"> /25</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-blue-600 mb-2"><Zap className="h-4 w-4"/> Avg Intent</div>
              <div className="text-3xl font-bold">{metrics?.avgIntent || 0}<span className="text-sm text-gray-400 font-normal"> /30</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-amber-600 mb-2"><Clock className="h-4 w-4"/> Avg Timing</div>
              <div className="text-3xl font-bold">{metrics?.avgTiming || 0}<span className="text-sm text-gray-400 font-normal"> /25</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-purple-600 mb-2"><Users className="h-4 w-4"/> Avg Engage</div>
              <div className="text-3xl font-bold">{metrics?.avgEngagement || 0}<span className="text-sm text-gray-400 font-normal"> /20</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Scoring Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Master Score</TableHead>
                  <TableHead>Fit</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOpps.map((opp: any) => (
                  <TableRow key={opp.id}>
                    <TableCell className="font-medium">
                      <a href={`/admin/scoring/company/${opp.company_id}`} className="text-indigo-600 hover:underline">
                        {opp.company_name}
                      </a>
                    </TableCell>
                    <TableCell>{opp.product_name}</TableCell>
                    <TableCell className="font-bold text-lg">{opp.final_score}</TableCell>
                    <TableCell className="text-emerald-600">{opp.fit_score}</TableCell>
                    <TableCell className="text-blue-600">{opp.intent_score}</TableCell>
                    <TableCell className="text-amber-600">{opp.timing_score}</TableCell>
                    <TableCell className="text-purple-600">{opp.engagement_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminAnalyticsDashboard;
