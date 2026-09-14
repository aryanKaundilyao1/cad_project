import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Activity, Mail, Phone, Calendar, ArrowRight, Target, Search, 
  Filter, FileText, Settings, ShieldAlert, MessageCircle, Clock 
} from 'lucide-react';
import { formatDistanceToNow, format, subDays, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ActivityPage() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(15);

  // Fetch activities with opportunity, account and contact names
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities_list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          opportunities (
            id, title,
            accounts (id, name)
          )
        `)
        .eq('workspace_id', user.id)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return <Phone className="w-4 h-4 text-blue-400" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-400" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'meeting': return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'system': return <Settings className="w-4 h-4 text-amber-400" />;
      case 'note': return <FileText className="w-4 h-4 text-slate-400" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  // --- Filtering ---
  const filteredActivities = React.useMemo(() => {
    return activities.filter((act: any) => {
      // 1. Search term match
      const matchesSearch = searchTerm
        ? act.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          act.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          act.opportunities?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          act.opportunities?.accounts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // 2. Type filter match
      let matchesType = true;
      if (typeFilter !== 'all') {
        const type = act.activity_type?.toLowerCase() || '';
        const title = act.title?.toLowerCase() || '';
        const desc = act.description?.toLowerCase() || '';
        
        if (typeFilter === 'stage_change') {
          matchesType = type === 'system' && (title.includes('stage') || title.includes('status') || desc.includes('stage') || desc.includes('status'));
        } else if (typeFilter === 'task') {
          matchesType = title.includes('task') || desc.includes('task');
        } else {
          matchesType = type === typeFilter.toLowerCase();
        }
      }

      // 3. Time filter match
      let matchesTime = true;
      if (timeFilter !== 'all') {
        const timestamp = new Date(act.activity_timestamp);
        const today = startOfDay(new Date());
        const yesterday = subDays(today, 1);
        
        if (timeFilter === 'today') {
          matchesTime = timestamp >= today;
        } else if (timeFilter === 'yesterday') {
          matchesTime = timestamp >= yesterday && timestamp < today;
        } else if (timeFilter === 'week') {
          matchesTime = timestamp >= subDays(today, 7);
        } else if (timeFilter === 'month') {
          matchesTime = timestamp >= subDays(today, 30);
        }
      }

      return matchesSearch && matchesType && matchesTime;
    });
  }, [activities, searchTerm, typeFilter, timeFilter]);

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Global Activity Timeline</h1>
          <p className="text-muted-foreground mt-1">Audit communication logs, status transitions, and system signals in real-time.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="bg-card/40 border-white/5 shadow-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-white/10 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPageSize(15); }}
              className="bg-background border border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1 md:flex-none"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meeting">Meetings</option>
              <option value="stage_change">Stage Changes</option>
              <option value="task">Tasks</option>
              <option value="system">System Updates</option>
              <option value="note">Notes</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => { setTimeFilter(e.target.value); setPageSize(15); }}
              className="bg-background border border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1 md:flex-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card className="bg-card border-white/10 shadow-md">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading activity timeline...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/80">No recent activities found</h3>
              <p className="text-muted-foreground text-xs mt-2">Adjust your filters or log new actions inside the pipeline to see them here.</p>
            </div>
          ) : (
            <>
              <div className="relative border-l border-white/10 pl-6 ml-2.5 space-y-8 py-2">
                {filteredActivities.slice(0, pageSize).map((act) => {
                  const opp = act.opportunities;
                  const companyName = opp?.accounts?.name;

                  return (
                    <div key={act.id} className="relative group animate-in fade-in duration-300">
                      {/* Circle timeline pin */}
                      <div className="absolute -left-[35px] top-1.5 w-5 h-5 rounded-full bg-background border border-white/10 flex items-center justify-center shadow">
                        {getIcon(act.activity_type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground capitalize">
                            {act.title || act.activity_type}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(act.activity_timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">{act.description}</p>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 mt-1 flex-wrap">
                          {opp && (
                            <button 
                              onClick={() => navigate(`/opportunities/${opp.id}`)}
                              className="font-medium text-primary hover:underline"
                            >
                              Opp: {opp.title}
                            </button>
                          )}
                          {companyName && (
                            <>
                              <span>•</span>
                              <span>Company: {companyName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Type: {act.activity_type.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredActivities.length > pageSize && (
                <div className="flex justify-center pt-8 border-t border-white/5 mt-6">
                  <Button 
                    onClick={() => setPageSize(prev => prev + 15)} 
                    variant="outline"
                    size="sm"
                    className="bg-slate-900 border-white/10 text-xs font-semibold hover:bg-slate-800"
                  >
                    Load More Activities
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
