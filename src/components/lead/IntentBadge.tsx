import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface IntentBadgeProps {
  level: string | null | undefined;
  type?: string | null;
  className?: string;
}

export const IntentBadge: React.FC<IntentBadgeProps> = ({ level, type, className = '' }) => {
  if (!level) return null;

  const getColor = (l: string) => {
    const upper = l.toUpperCase();
    if (upper === 'HIGH') return 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20';
    if (upper === 'MEDIUM') return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
  };

  return (
    <Badge variant="outline" className={`flex items-center gap-1 border-0 ${getColor(level)} ${className}`}>
      <Zap className="w-3 h-3" />
      <span>{level} Intent {type ? `- ${type}` : ''}</span>
    </Badge>
  );
};
