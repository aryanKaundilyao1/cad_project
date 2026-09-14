import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/queries/queryKeys';
import { intelligenceService } from '@/services/api';

export function useOpportunityIntelligence(opportunityId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.opportunities.intelligence(opportunityId!),
    queryFn: () => intelligenceService.getOpportunityIntelligence(opportunityId!),
    enabled: !!opportunityId,
    staleTime: 1000 * 60 * 5, // Cache intelligence for 5 minutes
  });
}
