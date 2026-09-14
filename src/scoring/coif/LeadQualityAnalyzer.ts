import { Lead, ReasonCode } from './types';

export class LeadQualityAnalyzer {
  public static analyze(lead: Lead): { score: number; reasons: ReasonCode[] } {
    const reasons: ReasonCode[] = [];
    let score = 0;

    // 1. Contactability (Max 40 points)
    let contactScore = 0;
    if (lead.metrics.hasEmail) {
      contactScore += 20;
      reasons.push({ type: 'contactability', description: 'Direct email available', impact: 'positive' });
    }
    if (lead.metrics.hasPhone) {
      contactScore += 20;
      reasons.push({ type: 'contactability', description: 'Direct phone number available', impact: 'positive' });
    }
    if (contactScore === 0) {
      reasons.push({ type: 'contactability', description: 'No direct contact info available', impact: 'negative' });
    }
    score += contactScore;

    // 2. Digital Presence & Descriptive Depth (Max 30 points)
    let digitalScore = 0;
    if (lead.metrics.hasWebsite) {
      digitalScore += 15;
      reasons.push({ type: 'business_fit', description: 'Active website available', impact: 'positive' });
    }
    const descLength = (lead.metrics.businessDescription || '').length;
    if (descLength > 200) {
      digitalScore += 15;
      reasons.push({ type: 'business_fit', description: 'Detailed business description', impact: 'positive' });
    } else if (descLength > 50) {
      digitalScore += 10;
    }
    score += digitalScore;

    // 3. Public Reputation (Max 30 points)
    let repScore = 0;
    const rating = lead.metrics.rating || 0;
    const reviewCount = lead.metrics.reviewCount || 0;

    if (reviewCount > 0) {
      const logReviews = Math.min(3, Math.log10(reviewCount)); // Max out at 1000 reviews (log10(1000) = 3)
      const reviewMultiplier = logReviews / 3; // 0 to 1

      if (rating >= 4.0) {
        repScore += 30 * reviewMultiplier;
        reasons.push({ type: 'market_fit', description: `Strong reputation (${rating}★, ${reviewCount} reviews)`, impact: 'positive' });
      } else if (rating >= 3.0) {
        repScore += 15 * reviewMultiplier;
        reasons.push({ type: 'market_fit', description: `Moderate reputation (${rating}★, ${reviewCount} reviews)`, impact: 'neutral' });
      } else {
        repScore += 0;
        reasons.push({ type: 'market_fit', description: `Poor reputation (${rating}★, ${reviewCount} reviews)`, impact: 'negative' });
      }
    } else {
      reasons.push({ type: 'market_fit', description: 'No public reviews available', impact: 'neutral' });
      repScore += 10;
    }
    score += repScore;

    // 4. Manual Enrichment / Keywords (Max 20 points)
    let enrichmentScore = 0;
    if (lead.metrics.manualEnrichmentScore) {
      enrichmentScore += lead.metrics.manualEnrichmentScore;
      reasons.push({ type: 'business_fit', description: `Manual enrichment applied (+${lead.metrics.manualEnrichmentScore})`, impact: 'positive' });
    }
    if (lead.metrics.productKeywords && lead.metrics.productKeywords.length > 0) {
      enrichmentScore += Math.min(10, lead.metrics.productKeywords.length * 2);
      reasons.push({ type: 'business_fit', description: `Strong keyword match (${lead.metrics.productKeywords.length} keywords)`, impact: 'positive' });
    }
    score += enrichmentScore;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: finalScore,
      reasons
    };
  }
}
