import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AISummaryPanelProps {
  summary: string | null;
  intentReasons?: any;
  className?: string;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ summary, intentReasons, className = '' }) => {
  if (!summary && (!intentReasons || intentReasons.length === 0)) return null;

  const reasonsList = Array.isArray(intentReasons) ? intentReasons : [];

  return (
    <Card className={`bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-4 h-4" />
          AI Research Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <p className="text-sm text-slate-700 leading-relaxed">
            {summary}
          </p>
        )}
        
        {reasonsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Intent Signals
            </h4>
            <div className="flex flex-wrap gap-2">
              {reasonsList.map((reason, i) => (
                <Badge key={i} variant="secondary" className="bg-white/60 text-slate-700 border-indigo-100">
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
