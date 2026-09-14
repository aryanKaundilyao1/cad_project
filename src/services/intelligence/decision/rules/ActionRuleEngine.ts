export interface EngineContext {
    signals: any[]; // Raw signal objects
    confidence: number;
    urgencyLevel: string; // 'Low', 'Medium', 'High', 'Critical'
    intentScore: number;
}

export interface RuleResult {
    matched: boolean;
    recommendedAction: string;
    reasonCodes: string[]; // e.g. ['TENDER_RELEASED', 'HIGH_URGENCY']
}

export class ActionRuleEngine {
    
    /**
     * Evaluates the context against a configurable set of rules to determine the Next Best Action.
     * Order matters: The first matching rule wins (Top-down execution).
     */
    static evaluate(context: EngineContext): RuleResult {
        
        // Rule 1: Low Confidence always forces Research
        if (context.confidence < 50) {
            return {
                matched: true,
                recommendedAction: 'Research Account',
                reasonCodes: ['LOW_CONFIDENCE', 'ACCOUNT_RESEARCH_REQUIRED']
            };
        }

        const signalNames = context.signals.map(s => s.name?.toUpperCase() || s.code?.toUpperCase() || '');

        // Rule 2: Tender + High Urgency = Call Procurement Head
        if (signalNames.includes('TENDER RELEASED') && (context.urgencyLevel === 'High' || context.urgencyLevel === 'Critical')) {
            return {
                matched: true,
                recommendedAction: 'Call', // Specifically Call Procurement Head ideally
                reasonCodes: ['TENDER_RELEASED', 'HIGH_TIMING_SCORE']
            };
        }

        // Rule 3: Proposal Requested
        if (signalNames.includes('PROPOSAL REQUESTED')) {
            return {
                matched: true,
                recommendedAction: 'Send Proposal',
                reasonCodes: ['HIGH_INTENT_ACTIVITY']
            };
        }

        // Rule 4: Stakeholder Engaged -> Schedule Meeting
        if (signalNames.includes('STAKEHOLDER ENGAGED')) {
            return {
                matched: true,
                recommendedAction: 'Schedule Meeting',
                reasonCodes: ['HIGH_INTENT_ACTIVITY']
            };
        }

        // Rule 5: RFP Deadline Near -> Executive Outreach
        if (signalNames.includes('RFP DEADLINE NEAR')) {
            return {
                matched: true,
                recommendedAction: 'Executive Outreach',
                reasonCodes: ['RFP_DETECTED', 'HIGH_TIMING_SCORE']
            };
        }

        // Default Fallback
        return {
            matched: false,
            recommendedAction: 'Follow Up',
            reasonCodes: []
        };
    }
}
