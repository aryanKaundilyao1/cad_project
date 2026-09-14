import { useQuery } from "@tanstack/react-query";
import { DecisionWorkspaceController } from "@/api/controllers/decisions/DecisionWorkspaceController";

export function useDecisionWorkspace(opportunityId: string) {
  return useQuery({
    queryKey: ["decisionWorkspace", opportunityId],
    queryFn: () => DecisionWorkspaceController.getDecisionWorkspace(opportunityId),
    enabled: !!opportunityId,
    staleTime: 60 * 1000, // 1 minute
  });
}
