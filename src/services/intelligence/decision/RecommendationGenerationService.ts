import { supabase } from '@/integrations/supabase/client';
import { UrgencyEngine } from './UrgencyEngine';
import { NextBestActionEngine } from './NextBestActionEngine';
import { DecisionTraceService } from './DecisionTraceService';
import { EngineContext } from './rules/ActionRuleEngine';
import { DecisionActionRecommendation, DecisionUrgencyScore } from '@/types/decision-intelligence';

export interface GenerationInput {
    companyId: string;
    opportunityId?: string;
    signals: any[];
    opportunityScore: number;
    purchaseProbability: number;
    confidence: number;
    timingScore: number;
    intentScore: number;
    signalRecencyDays: number;
    triggerMultiplier: number; // Max urgency weight from signals
    versionId?: string;
}

export class RecommendationGenerationService {
    
    /**
     * Orchestrates the Urgency Engine, Next Best Action Engine, and Trace Service
     * to produce a fully explainable Action Recommendation.
     */
    static async generateRecommendation(input: GenerationInput) {
        
        // 1. Calculate Urgency
        const urgencyResult = UrgencyEngine.calculateUrgency({
            timingScore: input.timingScore,
            signalRecencyDays: input.signalRecencyDays,
            triggerMultiplier: input.triggerMultiplier
        });

        // Save Urgency Score
        const { data: urgencyData, error: urgencyError } = await supabase
            .from('decision_urgency_scores')
            .insert([{
                company_id: input.companyId,
                opportunity_id: input.opportunityId,
                timing_score: input.timingScore,
                signal_recency_days: input.signalRecencyDays,
                trigger_multiplier: input.triggerMultiplier,
                decay_factor: urgencyResult.decayFactor,
                urgency_score: urgencyResult.urgencyScore,
                urgency_level: urgencyResult.urgencyLevel
            }]).select().single();

        if (urgencyError) throw urgencyError;

        // 2. Calculate Next Best Action
        const engineContext: EngineContext = {
            signals: input.signals,
            confidence: input.confidence,
            urgencyLevel: urgencyResult.urgencyLevel,
            intentScore: input.intentScore
        };

        const actionResult = NextBestActionEngine.calculateNextBestAction(engineContext, input.triggerMultiplier);

        // Fetch reason code IDs based on the string codes
        let reasonCodeIds: string[] = [];
        if (actionResult.reasonCodes.length > 0) {
            const { data: rcData } = await supabase
                .from('decision_reason_codes')
                .select('id')
                .in('code', actionResult.reasonCodes);
            if (rcData) {
                reasonCodeIds = rcData.map(rc => rc.id);
            }
        }

        // 3. Save Recommendation
        const { data: recData, error: recError } = await supabase
            .from('decision_action_recommendations')
            .insert([{
                company_id: input.companyId,
                opportunity_id: input.opportunityId,
                recommended_action: actionResult.recommendedAction,
                action_score: actionResult.actionScore,
                confidence_score: input.confidence,
                urgency_score: urgencyResult.urgencyScore,
                urgency_level: urgencyResult.urgencyLevel,
                best_contact_window: urgencyResult.bestContactWindow,
                reason_code_ids: reasonCodeIds,
                version_id: input.versionId
            }]).select().single();

        if (recError) throw recError;

        // 4. Capture Decision Trace
        const trace = await DecisionTraceService.captureTrace({
            company_id: input.companyId,
            opportunity_id: input.opportunityId,
            signal_snapshot: input.signals,
            opportunity_score: input.opportunityScore,
            probability: input.purchaseProbability,
            confidence: input.confidence,
            action_score: actionResult.actionScore,
            urgency_score: urgencyResult.urgencyScore,
            recommended_action: actionResult.recommendedAction,
            decision_trace: {
                urgencyParams: urgencyResult,
                actionParams: actionResult,
                context: engineContext
            }
        });

        return {
            recommendation: recData as DecisionActionRecommendation,
            urgency: urgencyData as DecisionUrgencyScore,
            trace
        };
    }
}
