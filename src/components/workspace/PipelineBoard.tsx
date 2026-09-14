import React, { useEffect, useState } from 'react';
import { Target, CheckCircle2, ChevronRight, Clock, AlertTriangle, Zap, Activity, PlayCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfileContext } from '@/contexts/BusinessProfileContext';
import { autoDiscoveryService } from '@/services/autoDiscoveryService';
import { useNavigate } from 'react-router-dom';
import { OpportunityScoreBadge } from '@/components/lead/OpportunityScoreBadge';
import { toast } from 'sonner';

const STAGE_CONFIG = [
  { name: 'Discovery', color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { name: 'Qualification', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { name: 'Validation', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
  { name: 'Probability', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  { name: 'Classification', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { name: 'Qualified Contacts', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { name: 'Won', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  { name: 'Lost', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
];

export function PipelineBoard() {
  const { profile, user } = useAuth() as any;
  const currentWorkspaceId = user?.id || profile?.user_id || profile?.id;
  const { businessProfile } = useBusinessProfileContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Run auto-discovery on load
  useEffect(() => {
    if (currentWorkspaceId && businessProfile) {
      autoDiscoveryService.loadMatchingLeadsToPipeline(currentWorkspaceId, businessProfile)
        .catch(err => console.error("Auto Discovery Error:", err));
    }
  }, [currentWorkspaceId, businessProfile]);

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities-pipeline', currentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          account:accounts(name),
          contacts(full_name),
          opportunity_health(health_status),
          opportunity_priorities(priority_level)
        `)
        .eq('workspace_id', currentWorkspaceId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspaceId,
    refetchInterval: 10000 // Refetch every 10s to see auto-discovery results if slow
  });

  const getOppsForStage = (stageName: string) => {
    return opportunities?.filter(opp => 
      (opp.stage || 'Discovery').toLowerCase() === stageName.toLowerCase()
    ) || [];
  };

  const handleRunPipeline = async () => {
    const discoveryOpps = getOppsForStage('Discovery');
    if (discoveryOpps.length === 0) {
      toast.info('No opportunities in Discovery stage to run.');
      return;
    }

    setIsProcessing(true);
    toast.loading(`Running pipeline for ${discoveryOpps.length} opportunities...`);

    try {
      const { data, error } = await supabase.rpc('execute_opportunity_pipeline', {
        p_opportunity_ids: discoveryOpps.map(opp => opp.id)
      });

      if (error) throw error;

      toast.success(`Successfully processed ${data.processed_count} opportunities!`);
      queryClient.invalidateQueries({ queryKey: ['opportunities-pipeline'] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to run pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full min-h-[550px]">Loading Pipeline...</div>;
  }

  const discoveryOppsCount = getOppsForStage('Discovery').length;

  return (
    <div className="flex flex-col h-full w-full gap-4 pb-6">
      <div className="flex justify-between items-center px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Intelligence Pipeline</h2>
          <p className="text-sm text-muted-foreground">Automatically score and classify leads through the intelligence workflow.</p>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={isProcessing || discoveryOppsCount === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          Run Pipeline ({discoveryOppsCount})
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto h-full min-h-[550px] w-full snap-x">
      {STAGE_CONFIG.map((stage) => {
        const stageOpps = getOppsForStage(stage.name);
        return (
          <div key={stage.name} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 min-w-[320px] flex-shrink-0 flex flex-col border border-border snap-start">
            
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`} />
                {stage.name}
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${stage.color}`}>
                {stageOpps.length}
              </span>
            </div>

            <div className="flex-1 rounded-lg flex flex-col gap-3 min-h-[150px]">
              {stageOpps.length > 0 ? (
                stageOpps.map((opp) => (
                  <div 
                    key={opp.id} 
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{opp.title}</h4>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap ml-2">
                        {opp.estimated_value ? `$${opp.estimated_value.toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {opp.account?.name || 'No Account'} 
                        {opp.contacts?.[0]?.full_name ? ` • ${opp.contacts[0].full_name}` : ''}
                      </p>
                      
                      <div className="flex gap-1 shrink-0 ml-2">
                        {opp.opportunity_priorities?.[0]?.priority_level && ['CRITICAL', 'HOT', 'HIGH'].includes(opp.opportunity_priorities[0].priority_level) && (
                          <span title={`${opp.opportunity_priorities[0].priority_level} Priority`} className={`w-2 h-2 rounded-full ${
                            opp.opportunity_priorities[0].priority_level === 'CRITICAL' ? 'bg-red-500' : 
                            opp.opportunity_priorities[0].priority_level === 'HOT' ? 'bg-orange-500' : 
                            'bg-blue-500'
                          }`} />
                        )}
                        {opp.opportunity_health?.[0]?.health_status && ['At Risk', 'Cooling'].includes(opp.opportunity_health[0].health_status) && (
                          <span title={`${opp.opportunity_health[0].health_status} Health`} className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(opp.created_at).toLocaleDateString()}</span>
                      </div>
                      {(opp.confidence || opp.master_score) && (
                        <div className="flex gap-2 items-center">
                          <OpportunityScoreBadge score={opp.confidence || opp.master_score} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center min-h-[100px]">
                  <span className="text-xs text-muted-foreground">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
