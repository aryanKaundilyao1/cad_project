import { useNavigate } from 'react-router-dom';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

interface RecommendedLeadsProps {
  limit?: number;
  className?: string;
}

const RecommendedLeads = ({ limit = 6, className = '' }: RecommendedLeadsProps) => {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useRecommendations(limit);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recommended for You</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) return null;

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v.toLocaleString('en-IN')}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Recommended Leads</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/tenders')}
        >
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {leads.map((lead: any, i: number) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="bg-white/[0.02] border-white/[0.06] hover:border-primary/20 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/tenders/${lead.id}`)}
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {lead.title}
                  </h4>
                  {formatBudget(lead.budget_min, lead.budget_max) && (
                    <span className="text-xs font-semibold text-primary whitespace-nowrap flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {formatBudget(lead.budget_min, lead.budget_max)}
                    </span>
                  )}
                </div>

                {lead.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{lead.description}</p>
                )}

                <div className="flex items-center justify-between">
                  {lead.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary/50" /> {lead.location}
                    </span>
                  )}
                  <Badge className="text-[9px] border-0 py-0 px-1.5" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> {lead.recommendationReason || 'Recommended'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedLeads;
