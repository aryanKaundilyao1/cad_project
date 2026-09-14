export interface VendorProfile {
  id: string;
  company_name: string | null;
  full_name: string | null;
  years_operation?: number | null;
  total_reviews?: number | null;
  rating?: number | null;
  is_verified?: boolean | null;
  location?: string | null;
}

export interface VendorScoreResult {
  score: number;
  badge: string;
  badgeColor: string;
  whyThisVendor: string;
  mockPastProjects: number;
}

// Pseudo-random number generator seeded by string
const seededRandom = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
};

export const calculateVendorScore = (
  vendor: VendorProfile,
  bidDetails?: { amount: number, time: string, projectBudgetMax?: number }
): VendorScoreResult => {
  let score = 50; // Base score

  // 1. Experience (Up to 15 points)
  const years = vendor.years_operation || 1;
  score += Math.min(15, years * 1.5);

  // 2. Track Record & Rating (Up to 25 points)
  const rating = vendor.rating || 4.0; // Default to 4 if none
  score += Math.min(25, (rating / 5) * 25);

  // 3. Reviews Volume (Up to 10 points)
  const reviews = vendor.total_reviews || 0;
  score += Math.min(10, reviews * 0.5);

  // 4. Verification (Flat 15 points)
  if (vendor.is_verified) {
    score += 15;
  }

  // 5. Mock Past Projects (Up to 15 points)
  const randomGen = seededRandom(vendor.id || "default");
  const mockPastProjects = Math.floor(randomGen() * 50) + 5; // Generates between 5 and 55 projects
  score += Math.min(15, mockPastProjects * 0.3);

  // 6. Bid Proposal Evaluation (Cost and Timeline)
  if (bidDetails) {
    const timeMatch = bidDetails.time.match(/(\d+)/);
    const months = timeMatch ? parseInt(timeMatch[1]) : 6;
    if (months <= 3) score += 10;
    else if (months <= 6) score += 5;
    else score -= 5;

    if (bidDetails.projectBudgetMax && bidDetails.amount <= bidDetails.projectBudgetMax) {
      score += 10; // Favorable cost
    }
  }

  // Cap at 99 for realism
  score = Math.min(99, Math.round(score));

  // Determine Badge
  let badge = "Standard";
  let badgeColor = "bg-muted text-muted-foreground";
  if (score >= 90) {
    badge = "Elite Match";
    badgeColor = "bg-amber-500/15 text-amber-500 border-amber-500/30";
  } else if (score >= 80) {
    badge = "Highly Recommended";
    badgeColor = "bg-primary/15 text-primary border-primary/30";
  } else if (score >= 70) {
    badge = "Reliable";
    badgeColor = "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  }

  // Determine AI "Why this vendor?" snippet
  const whyReasons = [];

  if (bidDetails) {
    if (bidDetails.projectBudgetMax && bidDetails.amount <= bidDetails.projectBudgetMax) {
      whyReasons.push(`Proposed highly competitive pricing within budget.`);
    }
    const timeMatch = bidDetails.time.match(/(\d+)/);
    if (timeMatch && parseInt(timeMatch[1]) <= 4) {
      whyReasons.push(`Fast proposed completion time.`);
    }
  }

  if (score >= 90) {
    whyReasons.push(`Top 5% rated vendor with outstanding historical performance.`);
  } else if (score >= 80) {
    whyReasons.push(`Strong regional presence with consistent delivery timelines.`);
  } else if (whyReasons.length === 0) {
    whyReasons.push(`Meets standard baseline criteria for this project scope.`);
  }

  if (vendor.is_verified) whyReasons.push("Fully verified credentials.");
  if (vendor.years_operation && vendor.years_operation > 5) whyReasons.push(`Over ${vendor.years_operation} years of proven market experience.`);

  const whyThisVendor = whyReasons.join(" ");

  return {
    score,
    badge,
    badgeColor,
    whyThisVendor,
    mockPastProjects
  };
};
