import { supabase } from "@/integrations/supabase/client";

export class ForecastExplanationService {
  /**
   * Generates a natural language explanation for the forecast.
   */
  static async explainForecast(opportunityId: string): Promise<string> {
    const { data: forecast } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (!forecast) return "No forecast profile found.";

    const { data: drivers } = await supabase
      .from('forecast_drivers')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    const { data: risks } = await supabase
      .from('forecast_risks')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    let explanation = `Expected Forecast: $${forecast.expected_case?.toLocaleString() ?? 0}\n`;
    explanation += `Commit Forecast: $${forecast.commit_case?.toLocaleString() ?? 0}\n`;
    explanation += `Confidence: ${forecast.forecast_confidence ?? 0}%\n\n`;

    if (drivers && drivers.length > 0) {
      explanation += `Positive Drivers:\n`;
      drivers.filter(d => d.driver_type !== 'BLOCKER' && d.driver_type !== 'NEGATIVE').forEach(d => {
        explanation += `- ${d.description}\n`;
      });
      explanation += `\n`;
    }

    if (risks && risks.length > 0) {
      explanation += `Forecast Risks:\n`;
      risks.forEach(r => {
        explanation += `- [${r.severity}] ${r.description}\n`;
      });
      explanation += `\n`;
    }

    return explanation;
  }
}
