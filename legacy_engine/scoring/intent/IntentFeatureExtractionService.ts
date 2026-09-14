import { supabase } from "@/integrations/supabase/client";
import { IntentFeatureSnapshot, IntentFeatureSnapshotService } from "./IntentFeatureSnapshotService";

export class IntentFeatureExtractionService {
  /**
   * Extracts raw intent signals from signal_events and creates a normalized feature snapshot array.
   */
  static async extractIntentFeatures(companyId: string, productId: string): Promise<IntentFeatureSnapshot[]> {
    // We fetch signal events for this company that match intent patterns.
    // For this blueprint, we'll look back 90 days.
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: events, error: eventError } = await supabase
      .from('signal_events')
      .select('*')
      .eq('company_id', companyId)
      .gte('event_date', ninetyDaysAgo.toISOString());

    if (eventError) {
      throw new Error(`Failed to fetch intent signals: ${eventError.message}`);
    }

    // Default counters
    let surgingTopicCount = 0;
    const surgeScores: any[] = [];
    let pricingPageVisits = 0;
    let demoRequests = 0;
    let specSheetDownloads = 0;
    let reviewSiteActivity = 0;
    let competitorComparisonActivity = 0;
    let socialEngagement = 0;

    // Aggregate based on signal definitions
    events?.forEach((event: any) => {
      // Third-party topic surge
      if (event.signal_type === 'third_party_surge') {
        const payload = event.event_payload;
        if (payload?.score) {
          surgeScores.push({ topic: payload.topic, score: payload.score });
          if (payload.score >= 60) {
            surgingTopicCount++;
          }
        }
      }
      
      // First party
      if (event.signal_type === 'website_visit' && event.event_payload?.url?.includes('pricing')) {
        pricingPageVisits++;
      }
      if (event.signal_type === 'demo_request') {
        demoRequests++;
      }
      if (event.signal_type === 'content_download' && event.event_payload?.type === 'spec_sheet') {
        specSheetDownloads++;
      }
      
      // Review / Search
      if (event.signal_type === 'review_site_visit') {
        reviewSiteActivity++;
      }
      if (event.signal_type === 'competitor_comparison') {
        competitorComparisonActivity++;
      }
      
      // Social
      if (event.signal_type === 'social_engagement') {
        socialEngagement++;
      }
    });

    const snapshots: IntentFeatureSnapshot[] = [
      { company_id: companyId, product_id: productId, feature_key: 'surging_topic_count', feature_value: surgingTopicCount, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'surge_scores', feature_value: surgeScores, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'pricing_page_visits', feature_value: pricingPageVisits, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'demo_requests', feature_value: demoRequests, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'spec_sheet_downloads', feature_value: specSheetDownloads, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'review_site_activity', feature_value: reviewSiteActivity, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'competitor_comparison_activity', feature_value: competitorComparisonActivity, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'social_engagement', feature_value: socialEngagement, feature_version: 1 }
    ];

    await IntentFeatureSnapshotService.storeSnapshots(snapshots);

    return snapshots;
  }
}
