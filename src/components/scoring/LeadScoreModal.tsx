import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { UserScorePersistenceService } from '@/scoring/UserScorePersistenceService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LeadScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
  companyName: string;
}

export function LeadScoreModal({ isOpen, onClose, leadId, companyName }: LeadScoreModalProps) {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id;

  const { data: scoreData, isLoading, error } = useQuery({
    queryKey: ['lead_score_breakdown', userId, leadId],
    queryFn: async () => {
      if (!userId || !leadId) return null;
      return UserScorePersistenceService.getOIEScore(userId, leadId);
    },
    enabled: !!userId && !!leadId && isOpen,
  });

  if (!isOpen) return null;

  const renderMetric = (label: string, score: number | null | undefined, max: number = 100, isPercentage: boolean = true) => {
    if (score == null) return null;
    const displayScore = isPercentage ? Math.round(score * 100) : Math.round(score);
    const displayMax = isPercentage ? 100 : max;
    
    let colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (displayScore < 40) colorClass = 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    else if (displayScore < 70) colorClass = 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';

    return (
      <div className="flex flex-col space-y-1 p-3 border rounded-lg bg-card shadow-sm">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{displayScore}</span>
          <Badge variant="outline" className={colorClass}>
            {displayScore}/{displayMax}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            Opportunity Intelligence Report
            <Badge variant="secondary" className="ml-2">OIE 1.0</Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed scoring breakdown for <strong>{companyName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : error || !scoreData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No detailed report available</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              The full Opportunity Intelligence Engine report hasn't been generated for this lead yet, or the data is unavailable.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-6 pb-6">
              
              {/* Primary Score Banner */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Final Lead Score</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary">{Math.round(scoreData.lead_score || 0)}</span>
                    <span className="text-lg text-muted-foreground font-medium">/ 100</span>
                  </div>
                </div>
                
                <div className="text-right max-w-[50%]">
                  <Badge className={`mb-2 text-sm ${scoreData.qual_score === 1 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    {scoreData.qual_score === 1 ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Qualified for Outreach</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Disqualified (Failed ICP)</span>
                    )}
                  </Badge>
                  <p className="text-sm text-muted-foreground italic line-clamp-2">
                    "{scoreData.explanation}"
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                  Score Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {renderMetric('Procurement (PROC)', scoreData.proc_score)}
                  {renderMetric('Contactability (CONT)', scoreData.cont_score)}
                  {renderMetric('Confidence (CONF)', scoreData.conf_score)}
                  {renderMetric('Commercial Fit (FIT)', scoreData.fit_score)}
                  {renderMetric('Risk (RISK)', scoreData.risk_score)}
                  {renderMetric('Opp Strength (OPP)', scoreData.opp_score)}
                </div>
              </div>

              {/* Evidence Section */}
              <Accordion type="single" collapsible className="w-full" defaultValue="evidence">
                <AccordionItem value="evidence">
                  <AccordionTrigger className="text-lg font-semibold">Evidence Tracking</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4" /> Present Evidence
                        </h4>
                        {scoreData.evidence_used?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {scoreData.evidence_used.map((e: string, i: number) => (
                              <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">
                                {e.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No specific evidence recorded.</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4" /> Missing Evidence (Penalties Applied)
                        </h4>
                        {scoreData.missing_evidence?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {scoreData.missing_evidence.map((e: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                                {e.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No missing evidence penalties.</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Score Breakdown (Raw Data) */}
                <AccordionItem value="raw-data">
                  <AccordionTrigger className="text-sm font-medium text-muted-foreground">Advanced: Raw Scoring Data</AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs">
                        {JSON.stringify({
                          score_version: scoreData.score_version,
                          created_at: scoreData.created_at,
                          metrics: {
                            PROC: scoreData.proc_score,
                            CONT: scoreData.cont_score,
                            CONF: scoreData.conf_score,
                            FIT: scoreData.fit_score,
                            RISK: scoreData.risk_score,
                            OPP: scoreData.opp_score,
                            QUAL: scoreData.qual_score,
                          }
                        }, null, 2)}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
