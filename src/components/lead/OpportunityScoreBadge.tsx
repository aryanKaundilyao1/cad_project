import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface OpportunityScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export const OpportunityScoreBadge: React.FC<OpportunityScoreBadgeProps> = ({ score, className = '' }) => {
  if (score === null || score === undefined) return null;

  const getColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
    if (s >= 50) return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
    return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20';
  };

  return (
    <Badge variant="outline" className={`flex items-center gap-1 border-0 ${getColor(score)} ${className}`}>
      <Target className="w-3 h-3" />
      <span>{score}</span>
    </Badge>
  );
};
