// src/services/intelligence/decision/products/ProductMatchEngine.ts

export interface SignalData {
    signalName: string;
    weight: number; // 0-1
}

export class ProductMatchEngine {
    /**
     * Hardcoded mapping for demo purposes. In production this would be loaded from a DB table.
     */
    static getProductRelevanceMapping(): Record<string, Record<string, number>> {
        return {
            'Facility Expansion': {
                'PEB Warehouse Package': 1.0,
                'Solar EPC Package': 0.6
            },
            'Warehouse Permit': {
                'PEB Construction Package': 1.0,
                'PEB Warehouse Package': 0.9
            },
            'Procurement Hiring': {
                'Vendor Discovery Package': 1.0
            },
            'Solar Installation Signal': {
                'Solar EPC Package': 1.0
            }
        };
    }

    /**
     * Calculates the signal-based relevance score for a specific product.
     */
    static calculateSignalRelevance(productId: string, productName: string, signals: SignalData[]): number {
        const mapping = this.getProductRelevanceMapping();
        let totalScore = 0;

        for (const signal of signals) {
            const relevantProducts = mapping[signal.signalName];
            if (relevantProducts && relevantProducts[productName]) {
                totalScore += signal.weight * relevantProducts[productName] * 100;
            }
        }
        
        return Math.min(100, totalScore);
    }
}
