import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Target, Users, Play, Pause, BarChart2, MessageSquare, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const WorkspaceCampaigns = () => {
  const { activeProduct } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  if (!activeProduct) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No product selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="h-8 w-8 text-primary" /> Campaigns for {activeProduct.name}</h1>
          <p className="text-muted-foreground">Manage your outreach and marketing campaigns for this product.</p>
        </div>
        <Button className="gap-2"><Target className="h-4 w-4" /> New Campaign</Button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">Filter</Button>
          <Button variant="outline" className="w-full sm:w-auto">Export</Button>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { name: 'EU Importers Q3 Outreach', status: 'Active', target: 'Europe', progress: 45, metrics: { contacted: 120, pending: 45, followup: 12, meeting: 5, won: 2, lost: 8 } },
          { name: 'APAC Wholesalers Push', status: 'Paused', target: 'Asia Pacific', progress: 12, metrics: { contacted: 50, pending: 20, followup: 2, meeting: 1, won: 0, lost: 2 } },
          { name: 'MENA Distributors', status: 'Active', target: 'Middle East', progress: 88, metrics: { contacted: 300, pending: 15, followup: 30, meeting: 12, won: 5, lost: 15 } }
        ].map((campaign, idx) => (
          <Card key={idx} className="shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{campaign.name}</h3>
                    <Badge variant={campaign.status === 'Active' ? 'success' : 'secondary'} className="gap-1">
                      {campaign.status === 'Active' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Targeting: {campaign.target}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Analytics</Button>
                </div>
              </div>

              {/* Campaign Pipeline Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center border border-border">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{campaign.metrics.contacted}</div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mt-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Contacted</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center border border-border">
                  <div className="text-2xl font-bold text-amber-600">{campaign.metrics.pending}</div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">Pending</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center border border-border">
                  <div className="text-2xl font-bold text-blue-600">{campaign.metrics.followup}</div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mt-1 flex items-center justify-center gap-1"><MessageSquare className="h-3 w-3" /> Follow Up Today</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center border border-border">
                  <div className="text-2xl font-bold text-purple-600">{campaign.metrics.meeting}</div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mt-1 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> Meeting Scheduled</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center border border-green-200 dark:border-green-900">
                  <div className="text-2xl font-bold text-green-600">{campaign.metrics.won}</div>
                  <div className="text-xs text-green-700 dark:text-green-500 uppercase font-semibold mt-1">Won</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg text-center border border-red-200 dark:border-red-900">
                  <div className="text-2xl font-bold text-red-600">{campaign.metrics.lost}</div>
                  <div className="text-xs text-red-700 dark:text-red-500 uppercase font-semibold mt-1">Lost</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceCampaigns;
