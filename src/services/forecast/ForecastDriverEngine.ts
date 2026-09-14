import { supabase } from "@/integrations/supabase/client";

export class ForecastDriverEngine {
  /**
   * Generates specific forecast drivers based on probability drivers.
   */
  static async evaluateDrivers(forecastId: string, opportunityId: string) {
    // Clear old active drivers
    await supabase
      .from('forecast_drivers')
      .update({ status: 'ARCHIVED' })
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    // Replicate high-impact probability drivers as forecast accelerators
    const { data: probDrivers } = await supabase
      .from('probability_drivers')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .in('driver_type', ['ACCELERATOR', 'BLOCKER'])
      .eq('status', 'ACTIVE');

    if (probDrivers && probDrivers.length > 0) {
      for (const driver of probDrivers) {
        await supabase
          .from('forecast_drivers')
          .insert({
            forecast_id: forecastId,
            opportunity_id: opportunityId,
            driver_type: driver.driver_type,
            severity: driver.severity,
            description: `[Forecast Impact] ${driver.description}`
          });
      }
    }
  }
}
