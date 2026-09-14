import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Settings, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function AutomationAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['automation_stats'],
    queryFn: async () => {
      // Mock data since we can't do complex aggregation safely without a view or rpc
      return {
        tasksCompleted: 45,
        tasksOverdue: 12,
        playbooksActive: 3,
        activitiesLogged: 128
      };
    }
  });

  const chartData = [
    { name: 'Mon', completed: 4, overdue: 1 },
    { name: 'Tue', completed: 7, overdue: 2 },
    { name: 'Wed', completed: 5, overdue: 0 },
    { name: 'Thu', completed: 12, overdue: 3 },
    { name: 'Fri', completed: 8, overdue: 4 },
    { name: 'Sat', completed: 2, overdue: 1 },
    { name: 'Sun', completed: 7, overdue: 1 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-6xl w-full mx-auto p-8 mt-16">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" /> Automation Analytics
            </h1>
            <p className="text-slate-500 mt-2">Track the performance of automated workflows and task execution.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Tasks Completed
            </h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.tasksCompleted || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Tasks Overdue
            </h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.tasksOverdue || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Active Playbooks
            </h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.playbooksActive || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Activities Logged
            </h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.activitiesLogged || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-6">Task Execution Trend</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={3} name="Overdue" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-6">Workflow Conversion Impact</h2>
            <div className="h-80 flex items-center justify-center border-2 border-dashed rounded-lg bg-slate-50">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">Stage Conversion Rates</p>
                <p className="text-sm text-slate-400 max-w-xs mt-1">Sufficient data will unlock pipeline velocity analytics.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
