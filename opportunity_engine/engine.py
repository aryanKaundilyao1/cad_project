from typing import Dict, Any
import math
from .models import Company, FinalScore, Explanation, ScoreComponent
from .scorers import (
    legitimacy, market_fit, product_fit, operations,
    buying_intent, trade, relationship, penalties
)

def compute_decay(company: Company, config: Dict[str, Any]) -> float:
    days = int(company.evidence.get("days_since_last_signal", 0))
    if days == 0:
        return 1.0
        
    lambda_val = config.get("decay", {}).get("digital_intent_lambda", 0.05)
    return math.exp(-lambda_val * days)

def determine_tier(score: float, explicit_sourcing: bool) -> str:
    if explicit_sourcing:
        return "T1"
    if score >= 75:
        return "T1"
    if score >= 45:
        return "T2"
    if score >= 20:
        return "T3"
    return "Unqualified"

def score_company(company: Company, config: Dict[str, Any]) -> FinalScore:
    weights = config.get("weights", {})
    product_compat = config.get("product_compatibility", {})
    
    components = {}
    
    components["legitimacy"] = legitimacy.score(company, weights.get("legitimacy", 5))
    components["market_fit"] = market_fit.score(company, weights.get("market_fit", 5))
    components["product_fit"] = product_fit.score(company, weights.get("product_fit", 10), product_compat)
    components["operations"] = operations.score(company, weights.get("operations", 5))
    
    components["buying_intent"] = buying_intent.score(company, weights.get("buying_intent", 25))
    components["trade"] = trade.score(company, weights.get("trade", 30))
    
    components["relationship"] = relationship.score(company, weights.get("relationship", 20))
    
    raw_fit = sum(components[k].score for k in ["legitimacy", "market_fit", "product_fit", "operations"])
    raw_intent = components["buying_intent"].score
    raw_timing = components["trade"].score
    raw_engagement = components["relationship"].score
    
    raw_total = raw_fit + raw_intent + raw_timing + raw_engagement
    
    multiplier, penalty_reasons = penalties.calculate_multipliers(company, config.get("penalties", {}))
    decay = compute_decay(company, config)
    
    final_score = raw_total * multiplier * decay
    
    # Collect reasons
    all_reasons = []
    for comp in components.values():
        all_reasons.extend(comp.reasons)
    all_reasons.extend(penalty_reasons)
    
    explanation = Explanation(
        fit=raw_fit,
        intent=raw_intent,
        timing=raw_timing,
        engagement=raw_engagement,
        negative_multiplier=multiplier,
        decay_factor=decay,
        reasons=all_reasons
    )
    
    explicit_sourcing = bool(company.evidence.get("explicit_sourcing", ""))
    tier = determine_tier(final_score, explicit_sourcing)
    
    confidence = "High" if len(all_reasons) > 3 else "Medium" if len(all_reasons) > 1 else "Low"
    
    return FinalScore(
        company_id=company.id,
        company_name=company.name,
        total_score=round(final_score, 1),
        tier=tier,
        confidence=confidence,
        explanation=explanation,
        components=components
    )
