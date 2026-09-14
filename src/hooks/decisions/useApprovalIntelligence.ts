import { useQuery } from "@tanstack/react-query";
import { ApprovalIntelligenceController } from "@/api/controllers/decisions/ApprovalIntelligenceController";

export function useApprovalIntelligence(decisionProfileId: string) {
  return useQuery({
    queryKey: ["approvalIntelligence", decisionProfileId],
    queryFn: () => ApprovalIntelligenceController.getApprovalIntelligence(decisionProfileId),
    enabled: !!decisionProfileId,
    staleTime: 60 * 1000,
  });
}
