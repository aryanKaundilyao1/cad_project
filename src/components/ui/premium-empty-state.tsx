import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function PremiumEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: PremiumEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-xl bg-card/50 dark:bg-card/20 backdrop-blur-sm ${className}`}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-lg hover:shadow-primary/20 transition-all">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
