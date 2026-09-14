import { supabase } from "@/integrations/supabase/client";

export class RevenuePermissionService {
  /**
   * Validates if a user has access to a specific macro portfolio scope.
   */
  static async validateAccess(userId: string, requestedScope: string): Promise<boolean> {
    const { data: perms } = await supabase
      .from('revenue_permissions')
      .select('allowed_scopes')
      .eq('user_id', userId)
      .single();

    if (!perms) return false;
    
    // Check if the user is allowed to view 'GLOBAL' or the specifically requested scope
    const allowed: string[] = perms.allowed_scopes;
    return allowed.includes('GLOBAL') || allowed.includes(requestedScope);
  }
}
