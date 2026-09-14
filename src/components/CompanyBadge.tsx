import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CompanyBadge = ({ profile }: { profile: any }) => {
  if (!profile) return null;

  // Premium and Elite plans are automatically verified
  const isAutoVerified = ['premium', 'elite'].includes(profile.subscription_plan?.toLowerCase());
  const isManuallyVerified = profile.is_verified === true;

  if (isAutoVerified || isManuallyVerified) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center justify-center ml-1 text-primary cursor-help">
              <ShieldCheck className="w-[18px] h-[18px] fill-primary/10" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-primary border-primary/20 text-white font-medium">
            <p>Verified Company</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};
