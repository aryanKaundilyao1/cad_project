import React, { useState } from 'react';
import { Search, ExternalLink, Activity, Trophy, ShieldAlert, Sparkles, Filter, Building2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import validationLeads from '@/data/validation_leads.json';
import AdminTemplateUpload from '@/components/AdminTemplateUpload';

const WorkspaceLeadIntelligence = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter leads
  const filteredLeads = validationLeads.filter(lead => 
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.signal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contactNowCount = validationLeads.filter(l => l.status === 'CONTACT NOW').length;
  const investigateCount = validationLeads.filter(l => l.status === 'INVESTIGATE').length;
  const nurtureCount = validationLeads.filter(l => l.status === 'NURTURE').length;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONTACT NOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INVESTIGATE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'NURTURE': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getConfBadge = (conf: string) => {
    switch (conf) {
      case 'High': return <Badge variant="default" className="bg-emerald-600">High (0.9)</Badge>;
      case 'Medium': return <Badge variant="secondary" className="bg-amber-500 text-white">Medium (0.6)</Badge>;
      case 'Low': return <Badge variant="outline" className="text-slate-500">Low (0.3)</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <AdminTemplateUpload />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-editorial font-bold text-foreground">Opportunity Intelligence</h1>
          </div>
          <p className="text-foreground/60 mt-2 font-light max-w-2xl">
            Real-time B2B pipeline scored via JOEP. Ranking is derived strictly from Lower Confidence Bound (LCB) on Expected Value.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-emerald-800 mb-1">CONTACT NOW (LCB &gt; 15K)</h3>
            <p className="text-3xl font-bold text-emerald-900 mb-2">{contactNowCount}</p>
            <p className="text-xs text-emerald-600/80">Highest priority outreach</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">INVESTIGATE (LCB &gt; 10K)</h3>
            <p className="text-3xl font-bold text-amber-900 mb-2">{investigateCount}</p>
            <p className="text-xs text-amber-600/80">Needs further validation</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">NURTURE (LCB &gt; 5K)</h3>
            <p className="text-3xl font-bold text-blue-900 mb-2">{nurtureCount}</p>
            <p className="text-xs text-blue-600/80">Long-term value potential</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">TOTAL SCORED</h3>
            <p className="text-3xl font-bold text-slate-900 mb-2">{validationLeads.length}</p>
            <p className="text-xs text-slate-500">Processed by JOEP Engine</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <div className="flex items-center gap-2 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search companies, signals, reasons..." 
              className="pl-9 bg-white" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Rank</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">LCB / EV</th>
                <th className="px-6 py-3 font-semibold">Confidence</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold max-w-[300px]">Top Reason</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => (
                <tr key={lead.id} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">#{lead.rank}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      {lead.company}
                      {lead.type === 'CHANNEL' && <Badge variant="outline" className="text-[10px]">CHANNEL</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {lead.signal}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">${lead.lcb.toLocaleString()} LCB</div>
                    <div className="text-xs text-slate-500 mt-1">${lead.ev.toLocaleString()} EV</div>
                  </td>
                  <td className="px-6 py-4">
                    {getConfBadge(lead.confidence)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 max-w-[300px] truncate text-slate-600">
                    {lead.reason}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/workspace/lead/${lead.id}`}>
                        View Details <ExternalLink className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    No leads found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default WorkspaceLeadIntelligence;
