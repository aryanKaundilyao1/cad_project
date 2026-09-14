// src/services/intelligence/decision/products/ProductRecommendationEngine.ts

import { ProductMatchEngine, SignalData } from './ProductMatchEngine';
import { ProductScoringEngine } from './ProductScoringEngine';

export interface EvaluatedProduct {
    productId: string;
    productName: string;
    signalScore: number;
    fitScore: number;
    intentScore: number;
    totalScore: number;
    confidence: number;
    reasonCodes: string[];
}

export class ProductRecommendationEngine {
    
    static evaluateProducts(
        products: { id: string, name: string }[],
        signals: SignalData[],
        fitScore: number,
        intentScore: number,
        probabilityScore: number
    ): EvaluatedProduct[] {
        
        const evaluated: EvaluatedProduct[] = [];
        
        for (const product of products) {
            const signalScore = ProductMatchEngine.calculateSignalRelevance(product.id, product.name, signals);
            
            // Only evaluate if there's some baseline relevance or fit
            if (signalScore > 0 || fitScore > 70) {
                const totalScore = ProductScoringEngine.calculateProductScore({
                    signalScore,
                    fitScore,
                    intentScore,
                    timingScore: 0, // Simplified for this phase
                    probabilityScore
                });
                
                // Confidence is heavily tied to the probability and presence of direct signals
                let confidence = probabilityScore * 0.5 + (signalScore > 50 ? 50 : 20);
                confidence = Math.min(100, confidence);

                const reasonCodes: string[] = [];
                if (signalScore > 75) reasonCodes.push('FACILITY_EXPANSION'); // Mock mapping
                if (fitScore > 80) reasonCodes.push('HIGH_FIT');
                if (intentScore > 80) reasonCodes.push('HIGH_INTENT');
                if (probabilityScore > 75) reasonCodes.push('HIGH_PROBABILITY');
                if (confidence < 50) reasonCodes.push('LOW_CONFIDENCE');

                evaluated.push({
                    productId: product.id,
                    productName: product.name,
                    signalScore,
                    fitScore,
                    intentScore,
                    totalScore,
                    confidence,
                    reasonCodes
                });
            }
        }
        
        // Sort descending
        evaluated.sort((a, b) => b.totalScore - a.totalScore);
        
        // Post-processing rules
        if (evaluated.length > 1 && (evaluated[0].totalScore - evaluated[1].totalScore < 10)) {
            evaluated[0].reasonCodes.push('MULTI_PRODUCT_MATCH');
        }
        
        if (evaluated.length > 0 && evaluated[0].confidence < 50) {
            evaluated[0].reasonCodes.push('DISCOVERY_REQUIRED');
        }

        return evaluated;
    }
}
