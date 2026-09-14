import React from 'react';

export function IntelligenceBarSlot() {
  return (
    <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Fit</div>
          <div className="text-xl font-bold">--</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Intent</div>
          <div className="text-xl font-bold">--</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase font-semibold">Timing</div>
          <div className="text-xl font-bold">--</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground uppercase font-semibold">Opportunity Score</div>
        <div className="text-2xl font-bold text-primary">--</div>
      </div>
    </div>
  );
}
