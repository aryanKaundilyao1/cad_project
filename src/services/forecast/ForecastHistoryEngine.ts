import { supabase } from "@/integrations/supabase/client";

export class ForecastHistoryEngine {
  /**
   * Records a snapshot of the forecast state if it changed significantly.
   */
  static async recordSnapshot(forecastId: string, stateSnapshot: any) {
    const { data, error } = await supabase
      .from('forecast_snapshots')
      .insert({
        forecast_id: forecastId,
        state_snapshot: stateSnapshot
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
