// src/services/intelligence/decision/playbooks/PlaybookDecisionMatrixEngine.ts

import { EvaluatedProduct } from '../products/ProductRecommendationEngine';
import { SignalData } from '../products/ProductMatchEngine';

export interface MatrixInputs {
    intentScore: number;
    urgencyScore: number;
    signals: SignalData[];
    topProduct?: EvaluatedProduct;
}

export class PlaybookDecisionMatrixEngine {
    
    /**
     * Rules-engine for selecting the correct playbook.
     */
    static determinePlaybook(inputs: MatrixInputs): { playbookName: string, reasonCodes: string[] } {
        const { intentScore, urgencyScore, signals, topProduct } = inputs;
        const reasonCodes: string[] = [];

        // Rule 1: Tender / RFP
        const hasTenderSignal = signals.some(s => s.signalName.toLowerCase().includes('tender') || s.signalName.toLowerCase().includes('rfp'));
        if (hasTenderSignal || intentScore > 90) {
            reasonCodes.push('TENDER_DETECTED');
            return { playbookName: 'Tender Response', reasonCodes };
        }

        // Rule 2: Competitor
        const hasCompetitorSignal = signals.some(s => s.signalName.toLowerCase().includes('competitor'));
        if (hasCompetitorSignal) {
            reasonCodes.push('COMPETITOR_ACTIVITY');
            return { playbookName: 'Competitor Displacement', reasonCodes };
        }

        // Rule 3: Product-specific Playbooks based on strong signal
        if (topProduct && topProduct.totalScore > 80) {
            if (topProduct.productName === 'PEB Warehouse Package') {
                return { playbookName: 'Warehouse Construction', reasonCodes };
            }
            if (topProduct.productName === 'PEB Construction Package') {
                return { playbookName: 'New Facility Launch', reasonCodes };
            }
            if (topProduct.productName === 'Vendor Discovery Package') {
                return { playbookName: 'Procurement Engagement', reasonCodes };
            }
        }

        // Rule 4: General Expansion
        const hasExpansionSignal = signals.some(s => s.signalName.toLowerCase().includes('expansion'));
        if (hasExpansionSignal) {
            reasonCodes.push('FACILITY_EXPANSION');
            return { playbookName: 'Expansion Opportunity', reasonCodes };
        }

        // Fallback
        reasonCodes.push('DISCOVERY_REQUIRED');
        return { playbookName: 'General Discovery', reasonCodes };
    }
}
