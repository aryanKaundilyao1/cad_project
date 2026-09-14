import { supabase } from "@/integrations/supabase/client";

export class NavigationBookmarkService {
  /**
   * Allows executives to save critical paths (e.g., "EMEA Approval Delay Pattern").
   */
  static async createBookmark(userId: string, pathId: string, title: string, description?: string) {
    const { data: bookmark, error } = await supabase.from('portfolio_navigation_bookmarks').insert({
      user_id: userId,
      path_id: pathId,
      title,
      description
    }).select('id').single();

    if (error || !bookmark) throw new Error("Failed to create bookmark");
    return bookmark.id;
  }
}
