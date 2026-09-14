import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertTriangle, Brain, Tag, Building2, MapPin } from 'lucide-react';
import { classifyLead } from '@/lib/leadClassification';
import type { Industry, Subcategory } from '@/types/intelligence';

const AdminClassificationTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState<string | null>(null);
  const [unclassifiedLeads, setUnclassifiedLeads] = useState<any[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, indRes, subRes] = await Promise.all([
        (supabase as any).from('leads')
          .select('id, title, description, location, category, industry_id, subcategory_id, ai_classification, status')
          .is('industry_id', null)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any).from('industries').select('*').eq('is_active', true).order('display_order'),
        (supabase as any).from('subcategories').select('*').eq('is_active', true).order('display_order'),
      ]);
      setUnclassifiedLeads(leadsRes.data || []);
      setIndustries(indRes.data || []);
      setSubcategories(subRes.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoClassify = async (lead: any) => {
    setClassifying(lead.id);
    try {
      const result = await classifyLead(
        lead.title || '',
        lead.description || '',
        lead.location || '',
        industries,
        subcategories
      );

      const updatePayload: Record<string, any> = { ai_classification: result };
      if (result.industry_id && result.confidence >= 0.6) {
        updatePayload.industry_id = result.industry_id;
      }
      if (result.subcategory_id && result.confidence >= 0.7) {
        updatePayload.subcategory_id = result.subcategory_id;
      }
      if (result.tags.length > 0) {
        updatePayload.relevance_tags = result.tags;
      }
      
      if (result.industry_id && result.confidence >= 0.6) {
        updatePayload.verification_status = 'VERIFIED';
        updatePayload.is_verified = true;
        updatePayload.status = 'active';
      }

      const { error } = await (supabase as any).from('leads').update(updatePayload).eq('id', lead.id);
      if (error) throw error;

      toast({
        title: result.confidence >= 0.6 ? 'Auto-classified ✅' : 'Needs Review ⚠️',
        description: `${result.industry_name || 'Unknown'} → ${result.subcategory_name || 'N/A'} (${Math.round(result.confidence * 100)}% confidence)`,
      });

      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setClassifying(null);
    }
  };

  const handleManualClassify = async (leadId: string, industryId: string) => {
    const industry = industries.find(i => i.id === industryId);
    const { error } = await (supabase as any).from('leads').update({
      industry_id: industryId,
      verification_status: 'VERIFIED',
      is_verified: true,
      status: 'active',
      ai_classification: { industry_id: industryId, industry_name: industry?.name, confidence: 1, reasoning: 'Manual admin classification' }
    }).eq('id', leadId);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Classified ✅' });
    fetchData();
  };

  const handleBulkClassify = async () => {
    for (const lead of unclassifiedLeads.slice(0, 10)) {
      await handleAutoClassify(lead);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Lead Classification
          </h2>
          <p className="text-sm text-muted-foreground">
            {unclassifiedLeads.length} leads pending classification
          </p>
        </div>
        {unclassifiedLeads.length > 0 && (
          <Button onClick={handleBulkClassify} className="gap-2" size="sm">
            <Brain className="h-4 w-4" /> Auto-Classify Top 10
          </Button>
        )}
      </div>

      {unclassifiedLeads.length === 0 ? (
        <Card className="bg-card/40 border-white/5">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mx-auto mb-3" />
            <p className="text-muted-foreground">All leads are classified! 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {unclassifiedLeads.map(lead => {
            const classification = lead.ai_classification as any;
            const hasLowConfidence = classification?.confidence && classification.confidence < 0.6;

            return (
              <Card key={lead.id} className={`bg-card/40 border-white/5 ${hasLowConfidence ? 'border-amber-500/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground truncate">{lead.title}</h4>
                        {hasLowConfidence && (
                          <Badge className="text-[9px] border-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Low Confidence
                          </Badge>
                        )}
                      </div>
                      {lead.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{lead.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {lead.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.location}</span>}
                        {lead.category && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {lead.category}</span>}
                      </div>
                      {classification?.reasoning && (
                        <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                          AI: {classification.reasoning}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select onValueChange={(val) => handleManualClassify(lead.id, val)}>
                        <SelectTrigger className="w-40 h-8 text-xs bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Assign industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => (
                            <SelectItem key={ind.id} value={ind.id} className="text-xs">{ind.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 border-white/10"
                        onClick={() => handleAutoClassify(lead)}
                        disabled={classifying === lead.id}
                      >
                        {classifying === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        AI
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminClassificationTab;
