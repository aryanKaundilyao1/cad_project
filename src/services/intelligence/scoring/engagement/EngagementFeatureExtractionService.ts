import { supabase } from "@/integrations/supabase/client";
import { EngagementFeatureSnapshot, EngagementFeatureSnapshotService } from "./EngagementFeatureSnapshotService";

export class EngagementFeatureExtractionService {
  /**
   * Extracts raw engagement signals from CRM activity and contacts.
   */
  static async extractEngagementFeatures(companyId: string, productId: string): Promise<EngagementFeatureSnapshot[]> {
    // In a real implementation, we would query the CRM interactions mapped to this company.
    // We would also fetch all `contacts` attached to this company and filter by those who have engaged.
    // For this blueprint, we simulate extraction via a mocked query or using signal_events.

    const { data: events, error: eventError } = await supabase
      .from('signal_events')
      .select('*')
      .eq('company_id', companyId)
      .gte('event_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

    if (eventError) {
      throw new Error(`Failed to fetch engagement signals: ${eventError.message}`);
    }

    // Default indicators
    const engagedContactRoles: string[] = [];
    let crmInteractions = 0;
    let mostRecentDate = null;

    events?.forEach((event: any) => {
      // Simulate engagement events
      if (event.signal_type === 'crm_interaction' || event.signal_type === 'meeting' || event.signal_type === 'email_response') {
        crmInteractions++;
        
        if (!mostRecentDate || new Date(event.event_date) > new Date(mostRecentDate)) {
          mostRecentDate = event.event_date;
        }

        // Suppose payload has contact role
        if (event.event_payload?.contact_role) {
          engagedContactRoles.push(event.event_payload.contact_role);
        }
      }
    });

    const uniqueRoles = [...new Set(engagedContactRoles)];
    const distinctEngagedContacts = uniqueRoles.length;
    let daysSinceEngagement = 999;
    
    if (mostRecentDate) {
      daysSinceEngagement = Math.floor((new Date().getTime() - new Date(mostRecentDate).getTime()) / (1000 * 3600 * 24));
    }

    const snapshots: EngagementFeatureSnapshot[] = [
      { company_id: companyId, product_id: productId, feature_key: 'distinct_engaged_contacts', feature_value: distinctEngagedContacts, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'contact_seniority', feature_value: uniqueRoles, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'crm_interactions', feature_value: crmInteractions, feature_version: 1 },
      { company_id: companyId, product_id: productId, feature_key: 'engagement_recency', feature_value: daysSinceEngagement, feature_version: 1 }
    ];

    await EngagementFeatureSnapshotService.storeSnapshots(snapshots);

    return snapshots;
  }
}
