import { supabase } from "@/integrations/supabase/client";

export class NavigationJourneyService {
  /**
   * Manages the aggregation of bookmarks into readable investigations.
   */
  static async createJourney(userId: string, title: string, summary: string, bookmarkIds: string[]) {
    const { data: journey, error } = await supabase.from('portfolio_navigation_journeys').insert({
      user_id: userId,
      title,
      summary
    }).select('id').single();

    if (error || !journey) throw new Error("Failed to create journey");

    // Link bookmarks to this journey
    const links = bookmarkIds.map((id, index) => ({
      journey_id: journey.id,
      bookmark_id: id,
      sequence_order: index
    }));

    if (links.length > 0) {
      await supabase.from('portfolio_journey_bookmarks').insert(links);
    }

    return journey.id;
  }
}
