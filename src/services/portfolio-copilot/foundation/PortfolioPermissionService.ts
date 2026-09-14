import { supabase } from "@/integrations/supabase/client";

export class PortfolioPermissionService {
  /**
   * Evaluates if a user has access to a specific intelligence domain or cross-section.
   * Prevents lateral access (e.g. Sales Rep A seeing Sales Rep B's opportunities in a portfolio query).
   */
  static async validateAccess(userId: string, requestedDomain: string, requestedRegion: string) {
    const { data: perm, error } = await supabase.from('portfolio_permissions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !perm) return false;

    const hasDomain = perm.allowed_domains.includes(requestedDomain) || perm.allowed_domains.includes('ALL');
    const hasRegion = perm.allowed_regions.includes(requestedRegion) || perm.allowed_regions.includes('ALL');

    return hasDomain && hasRegion;
  }
}
