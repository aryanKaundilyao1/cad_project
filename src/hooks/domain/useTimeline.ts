import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/queries/queryKeys';
import { timelineService } from '@/services/api';

export function useTimeline(opportunityId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.execution.timeline(opportunityId!),
    queryFn: () => timelineService.getOpportunityTimeline(opportunityId!),
    enabled: !!opportunityId,
    staleTime: 0, // Always fetch fresh timeline data
  });
}
