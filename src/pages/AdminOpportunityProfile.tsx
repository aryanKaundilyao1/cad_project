import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OpportunityProfileService } from "@/services/intelligence/analytics/OpportunityProfileService";
import { Loader2, TrendingUp, CheckCircle2, ShieldAlert, Info, LineChart } from "lucide-react";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AdminOpportunityProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (companyId: string) => {
    try {
      const [p, t, r] = await Promise.all([
        OpportunityProfileService.getCompanyProfile(companyId),
        OpportunityProfileService.getTimeline(companyId),
        OpportunityProfileService.getReasonCodes(companyId)
      ]);
      setProfile(p);
      
      const formattedTimeline = t.map((entry: any) => ({
        date: new Date(entry.snapshot_date).toLocaleDateString(),
        score: entry.final_score,
        product: entry.products?.name
      }));
      setTimeline(formattedTimeline);
      setReasons(r);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-indigo-600"/></div>;
  if (!profile) return <div className="p-24 text-center">Company not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 mt-2">Complete Opportunity Profile • {profile.industry || 'Unknown Industry'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5"/> Opportunity Timeline</CardTitle>
                <CardDescription>Historical master score evolution over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={timeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No historical data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Master Score</TableHead>
                      <TableHead>Fit</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.opportunity_scores?.map((opp: any) => (
                      <TableRow key={opp.id}>
                        <TableCell className="font-bold text-lg">{opp.final_score}</TableCell>
                        <TableCell className="text-emerald-600">{opp.fit_score}</TableCell>
                        <TableCell className="text-blue-600">{opp.intent_score}</TableCell>
                        <TableCell className="text-amber-600">{opp.timing_score}</TableCell>
                        <TableCell className="text-purple-600">{opp.engagement_score}</TableCell>
                      </TableRow>
                    ))}
                    {(!profile.opportunity_scores || profile.opportunity_scores.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-400">No scores generated yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> Active Reason Codes</CardTitle>
                <CardDescription>Consolidated explainability across all pillars.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {reasons.length > 0 ? reasons.map((rc: any, idx: number) => (
                    <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      {rc.reason_category === 'Positive' ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0"/> :
                        rc.reason_category === 'Negative' ? <ShieldAlert className="h-5 w-5 text-red-500 shrink-0"/> :
                        <Info className="h-5 w-5 text-blue-400 shrink-0"/>}
                      <div>
                        <div className="text-sm font-medium leading-tight">{rc.reason_text}</div>
                        <div className="text-xs text-gray-500 capitalize mt-1 flex justify-between">
                          <span>{rc.reason_type.replace('_', ' ')}</span>
                          <span className={rc.reason_category === 'Negative' ? 'text-red-500' : 'text-green-500'}>
                            {rc.reason_category === 'Negative' ? '' : '+'}{rc.contribution_value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-400 italic">No reason codes available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminOpportunityProfile;
