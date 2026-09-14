import { useQuery } from "@tanstack/react-query";
import { DecisionTimelineController } from "@/api/controllers/decisions/DecisionTimelineController";

export function useDecisionTimeline(decisionProfileId: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: ["decisionTimeline", decisionProfileId, limit, offset],
    queryFn: () => DecisionTimelineController.getEvents(decisionProfileId, limit, offset),
    enabled: !!decisionProfileId,
    staleTime: 60 * 1000,
  });
}
