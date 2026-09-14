/**
 * Restricts B2B leads to specific allowed domain clusters.
 * In Phase 2, this is STRICTLY isolated to only the user's own industry.
 */
export function getAllowedIndustrySlugs(userIndustrySlug: string | undefined): string[] {
  if (!userIndustrySlug) return [];

  const slugLower = userIndustrySlug.toLowerCase().trim();

  // STRICT ISOLATION: A user should ONLY see leads belonging to their own industry.
  return [slugLower];
}
