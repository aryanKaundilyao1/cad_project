from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    distinct_stakeholders = int(company.evidence.get("distinct_stakeholders", 1))
    
    if distinct_stakeholders >= 3:
        score += max_score * 0.6
        reasons.append(f"Broad buying committee ({distinct_stakeholders} stakeholders)")
    elif distinct_stakeholders == 2:
        score += max_score * 0.4
        reasons.append(f"Multiple stakeholders engaged ({distinct_stakeholders})")
    elif distinct_stakeholders == 1:
        score += max_score * 0.1
        reasons.append("Single stakeholder engaged")
        
    stakeholder_seniority = float(company.evidence.get("stakeholder_seniority", 0.4))
    if stakeholder_seniority >= 0.8:
        score += max_score * 0.4
        reasons.append("High stakeholder seniority (C-level/VP)")
    elif stakeholder_seniority >= 0.6:
        score += max_score * 0.2
        reasons.append("Medium stakeholder seniority (Director/Manager)")
        
    return ScoreComponent(
        name="Relationship",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
