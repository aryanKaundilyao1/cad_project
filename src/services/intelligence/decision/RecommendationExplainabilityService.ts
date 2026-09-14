// src/services/intelligence/decision/RecommendationExplainabilityService.ts

import { EvaluatedProduct } from './products/ProductRecommendationEngine';
import { PlaybookRecommendationResult } from './playbooks/PlaybookRecommendationEngine';

export class RecommendationExplainabilityService {
    
    static explainProductRecommendation(product: EvaluatedProduct): string {
        let text = `Recommended Product: ${product.productName} (Score: ${product.totalScore.toFixed(1)})\nBecause:\n`;
        
        if (product.reasonCodes.includes('FACILITY_EXPANSION')) {
            text += `- Strong Facility Expansion signals detected.\n`;
        }
        if (product.reasonCodes.includes('HIGH_FIT')) {
            text += `- Company has a high structural fit for this product.\n`;
        }
        if (product.reasonCodes.includes('HIGH_INTENT')) {
            text += `- High buyer intent detected.\n`;
        }
        if (product.reasonCodes.includes('HIGH_PROBABILITY')) {
            text += `- Historical purchase probability is very high.\n`;
        }
        if (product.reasonCodes.includes('MULTI_PRODUCT_MATCH')) {
            text += `- Note: Multiple products score within a 10% margin.\n`;
        }
        if (product.reasonCodes.includes('LOW_CONFIDENCE')) {
            text += `- WARNING: Confidence in this recommendation is low (<50%). Discovery required.\n`;
        }
        if (product.reasonCodes.includes('DISCOVERY_REQUIRED')) {
            text += `- Recommend running a Discovery Session first.\n`;
        }

        return text.trim();
    }

    static explainPlaybookRecommendation(playbook: PlaybookRecommendationResult, urgencyScore: number): string {
        let text = `Recommended Playbook: ${playbook.playbookName} (Score: ${playbook.score.toFixed(1)})\nBecause:\n`;

        if (playbook.reasonCodes.includes('TENDER_DETECTED')) {
            text += `- Active tender or RFP signals were detected or intent is extremely high.\n`;
        }
        if (playbook.reasonCodes.includes('COMPETITOR_ACTIVITY')) {
            text += `- Competitor activity detected; pivoting to displacement strategy.\n`;
        }
        if (playbook.reasonCodes.includes('FACILITY_EXPANSION')) {
            text += `- Expansion signals detected, suitable for upsell/expansion motion.\n`;
        }
        if (playbook.reasonCodes.includes('DISCOVERY_REQUIRED')) {
            text += `- Insufficient strong signals for a specialized playbook. Defaulting to Discovery.\n`;
        }

        if (urgencyScore > 80) {
            text += `- Urgency is HIGH. Accelerated timeline required.\n`;
        }

        return text.trim();
    }
}
