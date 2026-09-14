import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SignalTimelineBuilder } from "@/services/intelligence/SignalTimelineBuilder";
import { Loader2, BarChart3, Activity, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminSignalAnalytics = () => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSignals();
  }, []);

  const loadSignals = async () => {
    try {
      setIsLoading(true);
      const data = await SignalTimelineBuilder.getAllSignalsFiltered({});
      setSignals(data);
    } catch (err: any) {
      toast({ title: "Error loading analytics", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        </main>
      </div>
    );
  }

  // Aggregate Data
  const categoryCount = signals.reduce((acc, s) => {
    const cat = s.signal_definitions?.category || 'Unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  const reliabilityCount = signals.reduce((acc, s) => {
    const rel = s.reliability || 'Unknown';
    acc[rel] = (acc[rel] || 0) + 1;
    return acc;
  }, {});

  const reliabilityData = Object.entries(reliabilityCount).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Signal Analytics
          </h1>
          <p className="text-gray-500 mt-2">Aggregate metrics of internal signal intelligence</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><Activity className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Signals</p>
                <h3 className="text-2xl font-bold">{signals.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600"><Target className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">High Confidence (&gt;90%)</p>
                <h3 className="text-2xl font-bold">{signals.filter(s => s.confidence >= 90).length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Zap className="h-6 w-6"/></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">High Reliability</p>
                <h3 className="text-2xl font-bold">{signals.filter(s => s.reliability === 'high').length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Signals by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signal Reliability Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reliabilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {reliabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default AdminSignalAnalytics;
