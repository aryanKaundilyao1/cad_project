import { Lead, ClientContext, COIFResult, ReasonCode } from './types';
import { SourceAnalyzer } from './SourceAnalyzer';
import { IndustryAnalyzer } from './IndustryAnalyzer';
import { ProductAnalyzer } from './ProductAnalyzer';
import { BuyerAnalyzer } from './BuyerAnalyzer';
import { ClientAnalyzer } from './ClientAnalyzer';
import { ConfidenceEngine } from './ConfidenceEngine';
import { ReasonEngine } from './ReasonEngine';
import { FusionEngine } from './FusionEngine';

export class COIFEngine {
  public static evaluate(client: ClientContext, leads: Lead[]): COIFResult[] {
    const results: COIFResult[] = leads.map(lead => {
      let reasons: ReasonCode[] = [];

      // 1. Source Intelligence
      const sourceAnalysis = SourceAnalyzer.analyze(lead);
      reasons = reasons.concat(sourceAnalysis.reasons);

      // 2. Client & Market Intelligence
      const clientAnalysis = ClientAnalyzer.analyze(client, lead);
      reasons = reasons.concat(clientAnalysis.reasons);

      // 3. Product Intelligence
      const productAnalysis = ProductAnalyzer.analyze(client, lead);
      reasons = reasons.concat(productAnalysis.reasons);

      // 4. Industry Intelligence
      const industryAnalysis = IndustryAnalyzer.analyze(client, lead);
      reasons = reasons.concat(industryAnalysis.reasons);

      // 5. Buyer Intelligence
      const buyerAnalysis = BuyerAnalyzer.analyze(client, lead);
      reasons = reasons.concat(buyerAnalysis.reasons);

      // Calculate Raw COIF Score
      // Base calculation prioritizing Product Match and Client Context
      const rawCOIF = (clientAnalysis.score * 0.3) + (productAnalysis.score * 0.7);
      
      // Apply Industry & Buyer Multipliers
      let adjustedCOIF = rawCOIF * industryAnalysis.multiplier * buyerAnalysis.multiplier;
      const coifScore = Math.round(Math.min(100, Math.max(0, adjustedCOIF)));

      // 6. Confidence Engine
      const confidenceAnalysis = ConfidenceEngine.calculate(lead, sourceAnalysis.sourceScore);
      reasons = reasons.concat(confidenceAnalysis.reasons);

      // 7. Fusion Engine
      const fusionAnalysis = FusionEngine.fuse(lead.baselineOIEScore, coifScore, confidenceAnalysis.confidence);
      reasons = reasons.concat(fusionAnalysis.reasons);

      // Extract Evidence Summaries
      const evidenceSummary = [
        `Verified Sources: ${lead.sources.join(', ')}`,
        `Extracted Keywords: ${lead.metrics.productKeywords?.join(', ') || 'None'}`,
        `Certifications: ${lead.metrics.certificates?.join(', ') || 'None'}`,
        `Category: ${lead.metrics.businessCategory || 'Unknown'}`
      ];

      return {
        leadId: lead.id,
        leadName: lead.name,
        sources: lead.sources,
        baselineOIEScore: lead.baselineOIEScore,
        coifScore,
        finalScore: fusionAnalysis.finalScore,
        confidenceScore: confidenceAnalysis.confidence,
        confidenceTier: confidenceAnalysis.tier,
        reasons,
        evidenceSummary,
        marketFitScore: clientAnalysis.score,
        businessFitScore: productAnalysis.score,
        contactabilityScore: (lead.metrics.hasEmail ? 50 : 0) + (lead.metrics.hasPhone ? 50 : 0),
        relationshipPotentialScore: 50, // Default for now
        expansionPotentialScore: 50, // Default for now
        evidenceQualityScore: sourceAnalysis.sourceScore,
        riskScore: 100 - confidenceAnalysis.confidence,
      };
    });

    return results;
  }
}
