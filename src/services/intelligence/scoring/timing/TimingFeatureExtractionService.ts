import { supabase } from "@/integrations/supabase/client";
import { TimingFeatureSnapshot, TimingFeatureSnapshotService } from "./TimingFeatureSnapshotService";

export class TimingFeatureExtractionService {
  /**
   * Extracts raw timing signals from signal_events and creates a normalized feature snapshot array.
   */
  static async extractTimingFeatures(companyId: string, productId: string): Promise<TimingFeatureSnapshot[]> {
    // Look back 180 days for timing events as they have longer lifecycles
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

    const { data: events, error: eventError } = await supabase
      .from('signal_events')
      .select('*')
      .eq('company_id', companyId)
      .gte('event_date', oneEightyDaysAgo.toISOString());

    if (eventError) {
      throw new Error(`Failed to fetch timing signals: ${eventError.message}`);
    }

    // Default indicators
    let rfpPresent = false;
    let rfqPresent = false;
    let tenderPresent = false;
    const fundingEvents: any[] = [];
    const expansionEvents: any[] = [];
    const facilityOpenings: any[] = [];
    const jobPostings: any[] = [];
    const contractRenewals: any[] = [];
    const permitActivity: any[] = [];

    events?.forEach((event: any) => {
      // Explicit Sourcing
      if (event.signal_type === 'rfp_issued') rfpPresent = true;
      if (event.signal_type === 'rfq_issued') rfqPresent = true;
      if (event.signal_type === 'tender_published') tenderPresent = true;

      // Trigger Events
      if (event.signal_type === 'funding_received') fundingEvents.push({ date: event.event_date, payload: event.event_payload });
      if (event.signal_type === 'expansion_announced') expansionEvents.push({ date: event.event_date, payload: event.event_payload });
      if (event.signal_type === 'facility_opening') facilityOpenings.push({ date: event.event_date, payload: event.event_payload });
      if (event.signal_type === 'permit_filed') permitActivity.push({ date: event.event_date, payload: event.event_payload });

      // Hiring
      if (event.signal_type === 'job_posting') jobPostings.push({ date: event.event_date, payload: event.event_payload });

      // Contracts
      if (event.signal_type === 'contract_renewal') contractRenewals.push({ date: event.event_date, payload: event.event_payload });
    });

    const snapshots: TimingFeatureSnapshot[] = [
      { company_id: companyId, product_id: productId, feature_key: 'rfp_present', feature_value: rfpPresent, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'rfq_present', feature_value: rfqPresent, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'tender_present', feature_value: tenderPresent, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'funding_event', feature_value: fundingEvents, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'expansion_event', feature_value: expansionEvents, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'facility_opening', feature_value: facilityOpenings, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'job_postings', feature_value: jobPostings, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'contract_renewal', feature_value: contractRenewals, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'permit_activity', feature_value: permitActivity, feature_version: 1 }
    ];

    await TimingFeatureSnapshotService.storeSnapshots(snapshots);

    return snapshots;
  }
}
