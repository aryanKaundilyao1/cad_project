export interface UrgencyInput {
    timingScore: number;
    signalRecencyDays: number; // Days since the most critical signal
    triggerMultiplier: number; // Based on signal type (e.g. 1.5 for RFP)
    lambda?: number; // Configurable decay constant, default 0.1
}

export class UrgencyEngine {
    
    /**
     * Calculates the urgency score using exponential decay.
     * Formula: BaseTimingScore + (TriggerMultiplier * DecayFactor)
     * DecayFactor(t) = e^(-λ * days_since_signal)
     */
    static calculateUrgency(input: UrgencyInput) {
        const lambda = input.lambda || 0.1;
        
        // Math.exp returns e^x
        const decayFactor = Math.exp(-lambda * input.signalRecencyDays);
        
        const urgencyScore = input.timingScore + (input.triggerMultiplier * decayFactor);
        
        // Cap at 100
        const finalScore = Math.min(100, Math.max(0, urgencyScore));
        const level = this.getUrgencyLevel(finalScore);

        return {
            urgencyScore: finalScore,
            decayFactor,
            urgencyLevel: level,
            bestContactWindow: this.getBestContactWindow(level)
        };
    }

    private static getUrgencyLevel(score: number) {
        if (score >= 81) return 'Critical';
        if (score >= 61) return 'High';
        if (score >= 31) return 'Medium';
        return 'Low';
    }

    private static getBestContactWindow(level: string) {
        switch (level) {
            case 'Critical':
                return 'Immediately (< 2 hours)';
            case 'High':
                return '10 AM – 12 PM (Same Day)';
            case 'Medium':
                return '2 PM – 5 PM (1-2 Days)';
            default:
                return 'Next business day';
        }
    }
}
