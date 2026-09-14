import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Database, Network, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function AdminTemplateAnalytics() {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalSources: 0,
    totalTemplates: 0,
    totalUploads: 0,
    rowsImported: 0,
    failedRows: 0,
  });

  const [industryBreakdown, setIndustryBreakdown] = useState<any[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<any[]>([]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [sourcesRes, templatesRes, uploadsRes, indRes, compRes, projRes] = await Promise.all([
        supabase.from('sources').select('id, name', { count: 'exact' }),
        supabase.from('templates').select('id', { count: 'exact' }),
        supabase.from('uploads').select('id, source_id, industry_id, success_count, failed_count', { count: 'exact' }),
        supabase.from('industries').select('id, name'),
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' })
      ]);

      const sources = sourcesRes.data || [];
      const uploads = uploadsRes.data || [];
      const industries = indRes.data || [];

      let imported = 0;
      let failed = 0;
      
      const srcCount: Record<string, number> = {};
      const indCount: Record<string, number> = {};

      uploads.forEach(u => {
        imported += (u.success_count || 0);
        failed += (u.failed_count || 0);
        
        if (u.source_id) {
          srcCount[u.source_id] = (srcCount[u.source_id] || 0) + 1;
        }
        if (u.industry_id) {
          indCount[u.industry_id] = (indCount[u.industry_id] || 0) + 1;
        }
      });

      const srcChartData = Object.entries(srcCount).map(([id, count]) => {
        const source = sources.find(s => s.id === id);
        return { name: source?.name || 'Unknown Source', value: count };
      });

      const indChartData = Object.entries(indCount).map(([id, count]) => {
        const industry = industries.find(i => i.id === id);
        return { name: industry?.name || 'Unknown Industry', value: count };
      });

      setStats({
        totalSources: sourcesRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        totalUploads: uploadsRes.count || 0,
        rowsImported: imported,
        failedRows: failed,
        totalCompanies: compRes.count || 0,
        totalProjects: projRes.count || 0
      } as any);

      setSourceBreakdown(srcChartData);
      setIndustryBreakdown(indChartData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-emerald-500/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <div className="text-2xl font-bold text-emerald-400">{(stats as any).rowsImported}</div>
            <div className="text-xs text-emerald-400/70 uppercase">Raw Rows Imported</div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <Database className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">{(stats as any).totalCompanies}</div>
            <div className="text-xs text-blue-400/70 uppercase">Normalized Companies</div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/30">
          <CardContent className="p-6 text-center">
            <Network className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-purple-400">{(stats as any).totalProjects}</div>
            <div className="text-xs text-purple-400/70 uppercase">Normalized Projects</div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-red-500/30">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{(stats as any).failedRows}</div>
            <div className="text-xs text-red-400/70 uppercase">Failed Rows</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Uploads by Source</CardTitle>
            <CardDescription>Distribution of data uploads across connected sources.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {sourceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {sourceBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/5 rounded-lg">No upload data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Uploads by Industry</CardTitle>
            <CardDescription>Distribution of data uploads across industries.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {industryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={industryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {industryBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/5 rounded-lg">No upload data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
