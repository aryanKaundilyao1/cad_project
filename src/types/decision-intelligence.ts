export interface DecisionVersion {
    id: string;
    version_number: string;
    description?: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    deleted_at?: string;
}

export interface DecisionPlaybook {
    id: string;
    playbook_name: string;
    description?: string;
    category?: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    deleted_at?: string;
}

export interface DecisionAction {
    id: string;
    action_name: string;
    action_type?: string;
    description?: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    deleted_at?: string;
}

export interface DecisionRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    recommendation_type: string;
    recommendation_status: 'pending' | 'accepted' | 'rejected' | 'completed';
    generated_at: string;
    version_id?: string;
    confidence_score?: number;
    reason_codes?: any;
    metadata?: any;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    deleted_at?: string;
}

export interface DecisionContactRanking {
    id: string;
    company_id: string;
    contact_id?: string;
    rank_score: number;
    rank_position: number;
    ranking_reason?: string;
    version_id?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    deleted_at?: string;
}

export interface RecommendationHistory {
    id: string;
    recommendation_id: string;
    company_id: string;
    recommendation_data: any;
    version_id?: string;
    recorded_at: string;
}

export interface DecisionAuditLog {
    id: string;
    entity_type: 'playbook' | 'action' | 'recommendation' | 'version';
    entity_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    old_value?: any;
    new_value?: any;
    reason?: string;
    timestamp: string;
    user_id?: string;
}

export interface DecisionReasonCode {
    id: string;
    code: string;
    title: string;
    description?: string;
    category?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionActionRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    recommended_action: string;
    action_score?: number;
    confidence_score?: number;
    urgency_score?: number;
    urgency_level?: 'Low' | 'Medium' | 'High' | 'Critical';
    best_contact_window?: string;
    reason_code_ids?: string[];
    version_id?: string;
    generated_at: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionUrgencyScore {
    id: string;
    company_id: string;
    opportunity_id?: string;
    timing_score?: number;
    signal_recency_days?: number;
    trigger_multiplier?: number;
    decay_factor?: number;
    urgency_score?: number;
    urgency_level?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionDecisionTrace {
    id: string;
    company_id: string;
    opportunity_id?: string;
    signal_snapshot?: any;
    opportunity_score?: number;
    probability?: number;
    confidence?: number;
    action_score?: number;
    urgency_score?: number;
    recommended_action?: string;
    decision_trace?: any;
    generated_at: string;
}

export interface DecisionStakeholderRole {
    id: string;
    role_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionContactScore {
    id: string;
    company_id: string;
    contact_id: string;
    seniority_score?: number;
    engagement_score?: number;
    archetype_score?: number;
    influence_score?: number;
    decision_maker_score?: number;
    total_score?: number;
    created_at: string;
    updated_at: string;
}

export interface DecisionContactExplanation {
    id: string;
    company_id: string;
    contact_id: string;
    explanation: string;
    reason_codes?: string[];
    generated_at: string;
}

export interface DecisionContactRanking {
    id: string;
    company_id: string;
    contact_id: string;
    rank_score?: number;
    rank_position?: number;
    stakeholder_role?: string;
    confidence_score?: number;
    reason_codes?: string[];
    version_id?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionProductScore {
    id: string;
    company_id: string;
    product_id: string;
    signal_score?: number;
    intent_score?: number;
    fit_score?: number;
    timing_score?: number;
    probability_score?: number;
    total_score?: number;
    created_at: string;
    updated_at: string;
}

export interface DecisionProductRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    product_id: string;
    product_match_score?: number;
    recommendation_rank?: number;
    confidence_score?: number;
    reason_codes?: string[];
    version_id?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionPlaybookTemplate {
    id: string;
    name: string;
    description?: string;
    objectives?: string;
    escalation_rules?: string;
    success_metrics?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionPlaybookStep {
    id: string;
    playbook_id: string;
    step_order: number;
    step_title: string;
    step_description?: string;
    recommended_action?: string;
    days_offset?: number;
    required?: boolean;
    created_at: string;
    updated_at: string;
}

export interface DecisionPlaybookRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    playbook_id: string;
    playbook_score?: number;
    recommendation_rank?: number;
    reason_codes?: string[];
    version_id?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionDealHealth {
    id: string;
    company_id: string;
    opportunity_id?: string;
    deal_health_score?: number;
    health_status?: string;
    last_activity_date?: string;
    engagement_score?: number;
    risk_score?: number;
    stall_score?: number;
    created_at: string;
    updated_at: string;
}

export interface DecisionDealRisk {
    id: string;
    company_id: string;
    opportunity_id?: string;
    risk_type: string;
    risk_score?: number;
    severity?: string;
    reason_codes?: string[];
    created_at: string;
    updated_at: string;
}

export interface DecisionStallEvent {
    id: string;
    company_id: string;
    opportunity_id?: string;
    pipeline_stage: string;
    days_in_stage?: number;
    expected_days?: number;
    stall_risk?: number;
    stall_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface DecisionFollowupRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    recommended_action: string;
    days_to_wait?: number;
    recommended_date?: string;
    priority?: string;
    reason_codes?: string[];
    created_at: string;
    updated_at: string;
}

export interface DecisionInterventionRecommendation {
    id: string;
    company_id: string;
    opportunity_id?: string;
    intervention_type: string;
    priority?: string;
    reason_codes?: string[];
    recommended_action?: string;
    created_at: string;
    updated_at: string;
}

export interface RecommendationAdoption {
    id: string;
    company_id: string;
    opportunity_id?: string;
    recommendation_id: string;
    recommendation_type?: string;
    adoption_status?: string;
    adopted_at?: string;
    user_id?: string;
    created_at: string;
    updated_at: string;
}

export interface RecommendationOutcome {
    id: string;
    recommendation_id: string;
    company_id: string;
    opportunity_id?: string;
    outcome_type?: string;
    won?: boolean;
    lost?: boolean;
    days_to_outcome?: number;
    revenue_generated?: number;
    created_at: string;
    updated_at: string;
}

export interface ActionCenterTask {
    id: string;
    user_id?: string;
    company_id: string;
    opportunity_id?: string;
    recommended_action: string;
    priority?: string;
    priority_score?: number;
    due_date?: string;
    status?: string;
    created_at: string;
    updated_at: string;
}

export interface ExplainabilityLog {
    id: string;
    recommendation_id: string;
    decision_trace?: string;
    signals?: any;
    scores?: any;
    probability?: number;
    confidence?: number;
    reasons?: string[];
    created_at: string;
}

export interface PlaybookPerformance {
    id: string;
    playbook_id: string;
    executions?: number;
    wins?: number;
    losses?: number;
    conversion_rate?: number;
    average_sales_cycle?: number;
    revenue_influenced?: number;
    created_at: string;
    updated_at: string;
}
