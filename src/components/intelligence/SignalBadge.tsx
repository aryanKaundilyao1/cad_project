import { Badge } from "@/components/ui/badge";
import { SignalStrength } from "@/lib/intelligence/BaseSignalExtractor";
import { Activity, Zap, Flame, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SignalBadgeProps {
  strength: string; // Critical | High | Medium | Low
  showIcon?: boolean;
  className?: string;
  detectedAt?: string | Date;
}

export function SignalBadge({ strength, showIcon = true, className = "", detectedAt }: SignalBadgeProps) {
  let colorClass = "";
  let Icon = Activity;

  switch (strength) {
    case 'Critical':
      colorClass = "bg-red-500/20 text-red-500 border-red-500/30";
      Icon = Flame;
      break;
    case 'High':
      colorClass = "bg-purple-500/20 text-purple-400 border-purple-500/30";
      Icon = Zap;
      break;
    case 'Medium':
      colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
      Icon = ShieldAlert;
      break;
    case 'Low':
    default:
      colorClass = "bg-slate-500/20 text-slate-400 border-slate-500/30";
      Icon = Activity;
      break;
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <Badge variant="outline" className={`${colorClass} font-semibold flex items-center gap-1.5 px-2 py-0.5`}>
        {showIcon && <Icon className="w-3 h-3" />}
        {strength}
      </Badge>
      {detectedAt && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider pl-0.5">
          {formatDistanceToNow(new Date(detectedAt), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
