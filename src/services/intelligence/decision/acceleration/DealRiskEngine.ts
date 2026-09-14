// src/services/intelligence/decision/acceleration/DealRiskEngine.ts

export interface RiskInputData {
    signalName: string;
    weight: number;
}

export interface DealRisk {
    riskType: string;
    riskScore: number;
    severity: string;
}

export class DealRiskEngine {
    
    /**
     * Maps raw incoming signals to specific deal risks.
     */
    static evaluateRisks(signals: RiskInputData[], engagementScore: number): DealRisk[] {
        const risks: DealRisk[] = [];

        // Competition Risk
        const compSignal = signals.find(s => s.signalName.toLowerCase().includes('competitor'));
        if (compSignal) {
            risks.push({
                riskType: 'Competition Risk',
                riskScore: compSignal.weight * 100,
                severity: compSignal.weight > 0.7 ? 'High' : 'Medium'
            });
        }

        // Budget Risk
        const budgetSignal = signals.find(s => s.signalName.toLowerCase().includes('budget cut') || s.signalName.toLowerCase().includes('freeze'));
        if (budgetSignal) {
            risks.push({
                riskType: 'Budget Risk',
                riskScore: budgetSignal.weight * 100,
                severity: 'High'
            });
        }

        // Engagement Risk
        if (engagementScore < 30) {
            risks.push({
                riskType: 'Low Engagement Risk',
                riskScore: 100 - engagementScore,
                severity: engagementScore < 15 ? 'High' : 'Medium'
            });
        }

        return risks.sort((a, b) => b.riskScore - a.riskScore);
    }
}
