import { supabase } from "@/integrations/supabase/client";

export class PriorityConfidenceEngine {
  static async evaluate(opportunityId: string, priorityId: string) {
    // Confidence is derived from Forecast Confidence
    const { data: forecast } = await supabase
      .from('forecast_confidence')
      .select('confidence_score, confidence_level')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    const score = forecast?.confidence_score ?? 50;
    const level = forecast?.confidence_level ?? 'MEDIUM';

    await supabase.from('priority_confidence').insert({
      opportunity_priority_id: priorityId,
      confidence_score: score,
      confidence_level: level
    });

    return { score, level };
  }
}
